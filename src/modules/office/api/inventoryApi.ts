// src/modules/office/api/inventoryApi.ts
//
// Asset register (capital items with tags, custody, warranty/AMC,
// maintenance, depreciation, disposal) and consumable stores (items +
// stock movements with moving-average valuation).
//
//   colleges/{cid}/assets          one row per tagged asset
//   colleges/{cid}/inventoryItems  consumables with running qty / avg cost
//   colleges/{cid}/stockMovements  receipts, issues, adjustments (ledger)
//   colleges/{cid}/config/inventory  InventorySettings

import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayUnion,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { actor, clean, nextCounter, nowIso, num, officeCol, officeDoc, str, todayIso } from './officeDb'
import { applyMovement, formatAssetTag, normalizeInventorySettings, type AssetCategory, type DepMethod, type InventorySettings } from '../utils/inventoryEngine'

// ─── Settings ─────────────────────────────────────────────
export async function fetchInventorySettings(cid?: string): Promise<InventorySettings> {
  const snap = await getDoc(officeDoc('config', 'inventory', cid))
  return normalizeInventorySettings(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
}
export async function saveInventorySettings(s: InventorySettings): Promise<void> {
  await setDoc(officeDoc('config', 'inventory'), clean({ ...normalizeInventorySettings(s as unknown as Record<string, unknown>), updatedAt: nowIso(), updatedBy: actor().name }))
}

// ─── Assets ───────────────────────────────────────────────
export type AssetStatus = 'in_use' | 'in_store' | 'under_repair' | 'condemned' | 'disposed' | 'lost'
export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  in_use: 'In use', in_store: 'In store', under_repair: 'Under repair', condemned: 'Condemned', disposed: 'Disposed', lost: 'Lost / stolen',
}

export interface MaintenanceEntry { date: string; kind: 'repair' | 'service' | 'amc_visit' | 'upgrade'; vendor: string; cost: number; note: string; by: string }
export interface TransferEntry { date: string; from: string; to: string; by: string; note: string }

export interface Asset {
  id: string
  tag: string
  name: string
  category: string
  categoryCode: string
  method: DepMethod
  rate: number
  department: string
  location: string
  custodian: string
  make: string
  model: string
  serialNo: string
  purchaseDate: string
  cost: number
  salvage: number
  vendor: string
  invoiceNo: string
  poNo: string
  fundSource: string
  warrantyUntil: string
  amcVendor: string
  amcUntil: string
  status: AssetStatus
  notes: string
  lastVerifiedOn: string
  maintenance: MaintenanceEntry[]
  transfers: TransferEntry[]
  disposal: { date: string; method: string; amount: number; approvalRef: string; note: string } | null
  createdAt: string
}

const mapAsset = (id: string, r: DocumentData): Asset => ({
  id,
  tag: str(r.tag),
  name: str(r.name),
  category: str(r.category),
  categoryCode: str(r.categoryCode),
  method: (str(r.method) || 'WDV') as DepMethod,
  rate: num(r.rate),
  department: str(r.department),
  location: str(r.location),
  custodian: str(r.custodian),
  make: str(r.make),
  model: str(r.model),
  serialNo: str(r.serialNo),
  purchaseDate: str(r.purchaseDate),
  cost: num(r.cost),
  salvage: num(r.salvage),
  vendor: str(r.vendor),
  invoiceNo: str(r.invoiceNo),
  poNo: str(r.poNo),
  fundSource: str(r.fundSource),
  warrantyUntil: str(r.warrantyUntil),
  amcVendor: str(r.amcVendor),
  amcUntil: str(r.amcUntil),
  status: (str(r.status) || 'in_use') as AssetStatus,
  notes: str(r.notes),
  lastVerifiedOn: str(r.lastVerifiedOn),
  maintenance: Array.isArray(r.maintenance) ? (r.maintenance as MaintenanceEntry[]) : [],
  transfers: Array.isArray(r.transfers) ? (r.transfers as TransferEntry[]) : [],
  disposal: (r.disposal as Asset['disposal']) || null,
  createdAt: str(r.createdAt),
})

export async function fetchAssets(): Promise<Asset[]> {
  const snap = await getDocs(query(officeCol('assets'), limit(50000)))
  return snap.docs.map(d => mapAsset(d.id, d.data())).sort((a, b) => a.tag.localeCompare(b.tag, undefined, { numeric: true }))
}

export async function findAssetByTag(tag: string): Promise<Asset | null> {
  const snap = await getDocs(query(officeCol('assets'), where('tag', '==', tag.trim().toUpperCase()), limit(1)))
  return snap.empty ? null : mapAsset(snap.docs[0].id, snap.docs[0].data())
}

export type AssetInput = Omit<Asset, 'id' | 'tag' | 'categoryCode' | 'method' | 'rate' | 'lastVerifiedOn' | 'maintenance' | 'transfers' | 'disposal' | 'createdAt'> & {
  /** Serial numbers, one per unit; quantity = max(1, serials.length) unless qty given. */
  serials?: string[]
  qty?: number
}

/** Register one or more identical assets; each gets its own tag. */
export async function registerAssets(input: AssetInput, category: AssetCategory, settings: InventorySettings): Promise<string[]> {
  if (!input.name.trim()) throw new Error('Asset name is required.')
  const serials = (input.serials || []).map(s => s.trim()).filter(Boolean)
  const qty = Math.max(1, Math.min(500, serials.length || Math.floor(input.qty || 1)))
  const first = await nextCounter(`assetTag_${category.code}`, qty)
  const tags = Array.from({ length: qty }, (_, i) => formatAssetTag(settings.assetTagPrefix, category.code, first + i, settings.tagPadding))
  const batch = writeBatch(db)
  const createdAt = nowIso()
  const { serials: _s, qty: _q, ...rest } = input
  void _s
  void _q
  tags.forEach((tag, i) => {
    batch.set(doc(officeCol('assets')), clean({
      ...rest,
      name: input.name.trim(),
      tag,
      category: category.name,
      categoryCode: category.code,
      method: category.method,
      rate: category.rate,
      serialNo: serials[i] || (qty === 1 ? input.serialNo : ''),
      cost: num(input.cost),
      salvage: num(input.salvage),
      lastVerifiedOn: '',
      maintenance: [],
      transfers: [],
      disposal: null,
      createdAt,
      createdBy: actor().name,
    }))
  })
  await batch.commit()
  return tags
}

export async function updateAsset(id: string, patch: Partial<Omit<Asset, 'id' | 'tag' | 'maintenance' | 'transfers'>>): Promise<void> {
  await updateDoc(officeDoc('assets', id), clean({ ...patch, updatedAt: nowIso() }))
}

export async function transferAsset(a: Asset, to: { department: string; location: string; custodian: string }, note: string): Promise<void> {
  const entry: TransferEntry = {
    date: todayIso(),
    from: [a.department, a.location, a.custodian].filter(Boolean).join(' / '),
    to: [to.department, to.location, to.custodian].filter(Boolean).join(' / '),
    by: actor().name,
    note,
  }
  await updateDoc(officeDoc('assets', a.id), clean({ ...to, transfers: arrayUnion(entry), updatedAt: nowIso() }))
}

export async function addMaintenance(a: Asset, e: Omit<MaintenanceEntry, 'by'>, setStatus?: AssetStatus): Promise<void> {
  await updateDoc(officeDoc('assets', a.id), clean({ maintenance: arrayUnion({ ...e, cost: num(e.cost), by: actor().name }), ...(setStatus ? { status: setStatus } : {}), updatedAt: nowIso() }))
}

export async function disposeAsset(a: Asset, d: { date: string; method: 'sold' | 'scrapped' | 'donated' | 'written_off' | 'lost'; amount: number; approvalRef: string; note: string }): Promise<void> {
  await updateDoc(officeDoc('assets', a.id), clean({ status: d.method === 'lost' ? 'lost' : 'disposed', disposal: { ...d, amount: num(d.amount), by: actor().name }, updatedAt: nowIso() }))
}

export async function markVerified(ids: string[], date = todayIso()): Promise<void> {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db)
    ids.slice(i, i + 400).forEach(id => batch.update(officeDoc('assets', id), { lastVerifiedOn: date, lastVerifiedBy: actor().name }))
    await batch.commit()
  }
}

// ─── Consumables ──────────────────────────────────────────
export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  store: string
  reorderLevel: number
  qty: number
  avgCost: number
  lastReceivedOn: string
  active: boolean
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  unit: string
  type: 'in' | 'out' | 'adjust'
  qty: number
  rate: number
  value: number
  balanceQty: number
  date: string
  department: string
  issuedTo: string
  approvedBy: string
  vendor: string
  refNo: string
  note: string
  by: string
  createdAt: string
}

const mapItem = (id: string, r: DocumentData): InventoryItem => ({
  id,
  name: str(r.name),
  sku: str(r.sku),
  category: str(r.category),
  unit: str(r.unit) || 'nos',
  store: str(r.store),
  reorderLevel: num(r.reorderLevel),
  qty: num(r.qty),
  avgCost: num(r.avgCost),
  lastReceivedOn: str(r.lastReceivedOn),
  active: r.active !== false,
})

const mapMove = (id: string, r: DocumentData): StockMovement => ({
  id,
  itemId: str(r.itemId),
  itemName: str(r.itemName),
  unit: str(r.unit),
  type: (str(r.type) || 'in') as StockMovement['type'],
  qty: num(r.qty),
  rate: num(r.rate),
  value: num(r.value),
  balanceQty: num(r.balanceQty),
  date: str(r.date),
  department: str(r.department),
  issuedTo: str(r.issuedTo),
  approvedBy: str(r.approvedBy),
  vendor: str(r.vendor),
  refNo: str(r.refNo),
  note: str(r.note),
  by: str(r.by),
  createdAt: str(r.createdAt),
})

export async function fetchItems(): Promise<InventoryItem[]> {
  const snap = await getDocs(query(officeCol('inventoryItems'), limit(10000)))
  return snap.docs.map(d => mapItem(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveItem(input: Omit<InventoryItem, 'id' | 'qty' | 'avgCost' | 'lastReceivedOn'>, id?: string): Promise<string> {
  if (!input.name.trim()) throw new Error('Item name is required.')
  const data = { ...input, name: input.name.trim(), reorderLevel: num(input.reorderLevel), updatedAt: nowIso() }
  if (id) {
    await updateDoc(officeDoc('inventoryItems', id), clean(data))
    return id
  }
  const ref = await addDoc(officeCol('inventoryItems'), clean({ ...data, qty: 0, avgCost: 0, lastReceivedOn: '', createdAt: nowIso() }))
  return ref.id
}

export async function fetchMovements(opts: { itemId?: string; from?: string; to?: string }): Promise<StockMovement[]> {
  const cons = opts.itemId
    ? [where('itemId', '==', opts.itemId)]
    : [where('date', '>=', opts.from || '2000-01-01'), where('date', '<=', opts.to || '2999-12-31')]
  const snap = await getDocs(query(officeCol('stockMovements'), ...cons, limit(20000)))
  return snap.docs.map(d => mapMove(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Receive / issue / adjust atomically: item balance and ledger row together. */
export async function recordMovement(itemId: string, m: {
  type: 'in' | 'out' | 'adjust'
  qty: number
  rate?: number
  date?: string
  department?: string
  issuedTo?: string
  approvedBy?: string
  vendor?: string
  refNo?: string
  note?: string
}): Promise<StockMovement> {
  const itemRef = officeDoc('inventoryItems', itemId)
  const moveRef = doc(officeCol('stockMovements'))
  const by = actor().name
  return runTransaction(db, async tx => {
    const snap = await tx.get(itemRef)
    if (!snap.exists()) throw new Error('Item not found.')
    const item = mapItem(snap.id, snap.data())
    const next = applyMovement({ qty: item.qty, avgCost: item.avgCost }, m)
    const date = m.date || todayIso()
    const row = {
      itemId,
      itemName: item.name,
      unit: item.unit,
      type: m.type,
      qty: num(m.qty),
      rate: m.type === 'in' ? num(m.rate) : item.avgCost,
      value: next.value,
      balanceQty: next.qty,
      date,
      department: m.department || '',
      issuedTo: m.issuedTo || '',
      approvedBy: m.approvedBy || '',
      vendor: m.vendor || '',
      refNo: m.refNo || '',
      note: m.note || '',
      by,
      createdAt: nowIso(),
    }
    tx.set(moveRef, clean(row))
    tx.update(itemRef, clean({ qty: next.qty, avgCost: next.avgCost, ...(m.type === 'in' ? { lastReceivedOn: date } : {}), updatedAt: nowIso() }))
    return mapMove(moveRef.id, row)
  })
}

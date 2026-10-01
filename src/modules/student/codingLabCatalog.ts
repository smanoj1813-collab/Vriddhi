export type CodingLanguage = 'c' | 'cpp' | 'java' | 'python'
export type CodingLevel = 'beginner' | 'intermediate'

export interface CodingLabProgram {
  id: string
  title: string
  language: CodingLanguage
  subject: string
  topic: string
  level: CodingLevel
  objective: string
  stdin: string
  expectedOutput: string
  sourceCode: string
}

export const CODING_LANGUAGES: Array<{ id: CodingLanguage; label: string; versionHint: string }> = [
  { id: 'c', label: 'C', versionHint: 'GCC' },
  { id: 'cpp', label: 'C++', versionHint: 'G++' },
  { id: 'java', label: 'Java', versionHint: 'OpenJDK' },
  { id: 'python', label: 'Python 3', versionHint: 'Python' },
]

/**
 * Original BCA practice examples. These are starter exercises, not a claim of
 * complete coverage for any one university's lab manual. Every sample accepts
 * its example data through standard input where appropriate.
 */
export const CODING_LAB_PROGRAMS: CodingLabProgram[] = [
  {
    id: 'c-hello-world', title: 'Hello world', language: 'c', subject: 'Programming in C', topic: 'Program structure', level: 'beginner',
    objective: 'Compile a minimal C program and print a line to standard output.', stdin: '', expectedOutput: 'Hello, BCA!',
    sourceCode: `#include <stdio.h>

int main(void) {
    printf("Hello, BCA!\\n");
    return 0;
}`,
  },
  {
    id: 'c-add-two-numbers', title: 'Add two numbers', language: 'c', subject: 'Programming in C', topic: 'Input and output', level: 'beginner',
    objective: 'Read two integers and print their sum.', stdin: '12 8', expectedOutput: '20',
    sourceCode: `#include <stdio.h>

int main(void) {
    int first;
    int second;
    if (scanf("%d %d", &first, &second) != 2) return 1;
    printf("%d\\n", first + second);
    return 0;
}`,
  },
  {
    id: 'c-even-or-odd', title: 'Even or odd', language: 'c', subject: 'Programming in C', topic: 'Selection', level: 'beginner',
    objective: 'Use the remainder operator and a conditional branch.', stdin: '7', expectedOutput: 'Odd',
    sourceCode: `#include <stdio.h>

int main(void) {
    int number;
    if (scanf("%d", &number) != 1) return 1;
    printf(number % 2 == 0 ? "Even\\n" : "Odd\\n");
    return 0;
}`,
  },
  {
    id: 'c-largest-of-three', title: 'Largest of three numbers', language: 'c', subject: 'Programming in C', topic: 'Selection', level: 'beginner',
    objective: 'Compare values with if and else branches.', stdin: '12 28 17', expectedOutput: 'Largest: 28',
    sourceCode: `#include <stdio.h>

int main(void) {
    int a, b, c, largest;
    if (scanf("%d %d %d", &a, &b, &c) != 3) return 1;
    largest = a;
    if (b > largest) largest = b;
    if (c > largest) largest = c;
    printf("Largest: %d\\n", largest);
    return 0;
}`,
  },
  {
    id: 'c-factorial-loop', title: 'Factorial with a loop', language: 'c', subject: 'Programming in C', topic: 'Loops', level: 'beginner',
    objective: 'Calculate n factorial by multiplying the values from 1 through n.', stdin: '5', expectedOutput: '120',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n;
    unsigned long long result = 1;
    if (scanf("%d", &n) != 1 || n < 0 || n > 20) return 1;
    for (int i = 2; i <= n; i++) result *= (unsigned long long)i;
    printf("%llu\\n", result);
    return 0;
}`,
  },
  {
    id: 'c-fibonacci-series', title: 'Fibonacci series', language: 'c', subject: 'Programming in C', topic: 'Loops', level: 'beginner',
    objective: 'Print the first n Fibonacci values by updating two variables.', stdin: '8', expectedOutput: '0 1 1 2 3 5 8 13',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n;
    long long first = 0, second = 1;
    if (scanf("%d", &n) != 1 || n < 1 || n > 90) return 1;
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%lld", first);
        long long next = first + second;
        first = second;
        second = next;
    }
    printf("\\n");
    return 0;
}`,
  },
  {
    id: 'c-prime-check', title: 'Prime number check', language: 'c', subject: 'Programming in C', topic: 'Loops', level: 'beginner',
    objective: 'Check divisors only up to the square root of the input value.', stdin: '29', expectedOutput: 'Prime',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n;
    int prime = 1;
    if (scanf("%d", &n) != 1) return 1;
    if (n < 2) prime = 0;
    for (int i = 2; i <= n / i && prime; i++) {
        if (n % i == 0) prime = 0;
    }
    printf(prime ? "Prime\\n" : "Not prime\\n");
    return 0;
}`,
  },
  {
    id: 'c-reverse-number', title: 'Reverse an integer', language: 'c', subject: 'Programming in C', topic: 'Loops and arithmetic', level: 'beginner',
    objective: 'Build the reversed number one digit at a time using division and remainder.', stdin: '1352', expectedOutput: '2531',
    sourceCode: `#include <stdio.h>

int main(void) {
    int number, reversed = 0;
    if (scanf("%d", &number) != 1 || number < 0) return 1;
    while (number > 0) {
        reversed = reversed * 10 + number % 10;
        number /= 10;
    }
    printf("%d\\n", reversed);
    return 0;
}`,
  },
  {
    id: 'c-number-palindrome', title: 'Palindrome number', language: 'c', subject: 'Programming in C', topic: 'Loops and arithmetic', level: 'beginner',
    objective: 'Compare a non-negative number with the number formed by reversing its digits.', stdin: '1221', expectedOutput: 'Palindrome',
    sourceCode: `#include <stdio.h>

int main(void) {
    int number, original, reversed = 0;
    if (scanf("%d", &number) != 1 || number < 0) return 1;
    original = number;
    while (number > 0) {
        reversed = reversed * 10 + number % 10;
        number /= 10;
    }
    printf(original == reversed ? "Palindrome\\n" : "Not palindrome\\n");
    return 0;
}`,
  },
  {
    id: 'c-armstrong-number', title: 'Three-digit Armstrong number', language: 'c', subject: 'Programming in C', topic: 'Loops and arithmetic', level: 'intermediate',
    objective: 'Add the cube of each digit and compare the total with the original number.', stdin: '153', expectedOutput: 'Armstrong number',
    sourceCode: `#include <stdio.h>

int main(void) {
    int number, original, sum = 0;
    if (scanf("%d", &number) != 1 || number < 0 || number > 999) return 1;
    original = number;
    while (number > 0) {
        int digit = number % 10;
        sum += digit * digit * digit;
        number /= 10;
    }
    printf(original == sum ? "Armstrong number\\n" : "Not an Armstrong number\\n");
    return 0;
}`,
  },
  {
    id: 'c-gcd', title: 'Greatest common divisor', language: 'c', subject: 'Programming in C', topic: 'Functions and arithmetic', level: 'intermediate',
    objective: 'Use Euclid’s algorithm to find the greatest common divisor.', stdin: '48 18', expectedOutput: 'GCD: 6',
    sourceCode: `#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2 || a < 0 || b < 0) return 1;
    while (b != 0) {
        int remainder = a % b;
        a = b;
        b = remainder;
    }
    printf("GCD: %d\\n", a);
    return 0;
}`,
  },
  {
    id: 'c-array-min-max', title: 'Array minimum and maximum', language: 'c', subject: 'Programming in C', topic: 'One-dimensional arrays', level: 'beginner',
    objective: 'Read an array and track its smallest and largest values.', stdin: '5\n8 3 11 2 6', expectedOutput: 'Minimum: 2\nMaximum: 11',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    int minimum = values[0], maximum = values[0];
    for (int i = 1; i < n; i++) {
        if (values[i] < minimum) minimum = values[i];
        if (values[i] > maximum) maximum = values[i];
    }
    printf("Minimum: %d\\nMaximum: %d\\n", minimum, maximum);
    return 0;
}`,
  },
  {
    id: 'c-linear-search', title: 'Linear search', language: 'c', subject: 'Programming in C', topic: 'Searching', level: 'beginner',
    objective: 'Scan an array from left to right and report the first matching index.', stdin: '5\n8 3 11 2 6\n11', expectedOutput: 'Found at index 2',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100], target, found = -1;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    if (scanf("%d", &target) != 1) return 1;
    for (int i = 0; i < n; i++) {
        if (values[i] == target) { found = i; break; }
    }
    if (found >= 0) printf("Found at index %d\\n", found);
    else printf("Not found\\n");
    return 0;
}`,
  },
  {
    id: 'c-binary-search', title: 'Binary search', language: 'c', subject: 'Programming in C', topic: 'Searching', level: 'intermediate',
    objective: 'Search a sorted array by repeatedly discarding half of the remaining range.', stdin: '6\n2 5 8 12 16 23\n16', expectedOutput: 'Found at index 4',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100], target;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    if (scanf("%d", &target) != 1) return 1;
    int left = 0, right = n - 1, found = -1;
    while (left <= right) {
        int middle = left + (right - left) / 2;
        if (values[middle] == target) { found = middle; break; }
        if (values[middle] < target) left = middle + 1;
        else right = middle - 1;
    }
    if (found >= 0) printf("Found at index %d\\n", found);
    else printf("Not found\\n");
    return 0;
}`,
  },
  {
    id: 'c-bubble-sort', title: 'Bubble sort', language: 'c', subject: 'Programming in C', topic: 'Sorting', level: 'beginner',
    objective: 'Sort values by comparing and swapping adjacent elements.', stdin: '5\n5 1 4 2 8', expectedOutput: '1 2 4 5 8',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    for (int end = n - 1; end > 0; end--) {
        for (int i = 0; i < end; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
    }
    for (int i = 0; i < n; i++) printf("%d%c", values[i], i + 1 == n ? '\\n' : ' ');
    return 0;
}`,
  },
  {
    id: 'c-selection-sort', title: 'Selection sort', language: 'c', subject: 'Programming in C', topic: 'Sorting', level: 'beginner',
    objective: 'Select the smallest remaining value and place it at the front of the unsorted part.', stdin: '5\n29 10 14 37 13', expectedOutput: '10 13 14 29 37',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    for (int i = 0; i < n - 1; i++) {
        int smallest = i;
        for (int j = i + 1; j < n; j++) {
            if (values[j] < values[smallest]) smallest = j;
        }
        int temp = values[i];
        values[i] = values[smallest];
        values[smallest] = temp;
    }
    for (int i = 0; i < n; i++) printf("%d%c", values[i], i + 1 == n ? '\\n' : ' ');
    return 0;
}`,
  },
  {
    id: 'c-array-reverse', title: 'Reverse an array', language: 'c', subject: 'Programming in C', topic: 'One-dimensional arrays', level: 'beginner',
    objective: 'Swap matching elements from the two ends until the middle is reached.', stdin: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n, values[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &values[i]) != 1) return 1;
    }
    for (int left = 0, right = n - 1; left < right; left++, right--) {
        int temp = values[left];
        values[left] = values[right];
        values[right] = temp;
    }
    for (int i = 0; i < n; i++) printf("%d%c", values[i], i + 1 == n ? '\\n' : ' ');
    return 0;
}`,
  },
  {
    id: 'c-matrix-addition', title: 'Add two matrices', language: 'c', subject: 'Programming in C', topic: 'Two-dimensional arrays', level: 'beginner',
    objective: 'Add corresponding values from two 2 by 2 matrices.', stdin: '1 2\n3 4\n5 6\n7 8', expectedOutput: '6 8\n10 12',
    sourceCode: `#include <stdio.h>

int main(void) {
    int first[2][2], second[2][2];
    for (int row = 0; row < 2; row++)
        for (int col = 0; col < 2; col++)
            if (scanf("%d", &first[row][col]) != 1) return 1;
    for (int row = 0; row < 2; row++)
        for (int col = 0; col < 2; col++)
            if (scanf("%d", &second[row][col]) != 1) return 1;
    for (int row = 0; row < 2; row++) {
        for (int col = 0; col < 2; col++)
            printf("%d%c", first[row][col] + second[row][col], col == 1 ? '\\n' : ' ');
    }
    return 0;
}`,
  },
  {
    id: 'c-matrix-transpose', title: 'Transpose a matrix', language: 'c', subject: 'Programming in C', topic: 'Two-dimensional arrays', level: 'beginner',
    objective: 'Exchange row and column positions for a 2 by 3 matrix.', stdin: '1 2 3\n4 5 6', expectedOutput: '1 4\n2 5\n3 6',
    sourceCode: `#include <stdio.h>

int main(void) {
    int matrix[2][3];
    for (int row = 0; row < 2; row++)
        for (int col = 0; col < 3; col++)
            if (scanf("%d", &matrix[row][col]) != 1) return 1;
    for (int col = 0; col < 3; col++) {
        for (int row = 0; row < 2; row++)
            printf("%d%c", matrix[row][col], row == 1 ? '\\n' : ' ');
    }
    return 0;
}`,
  },
  {
    id: 'c-string-palindrome', title: 'Palindrome string', language: 'c', subject: 'Programming in C', topic: 'Strings', level: 'beginner',
    objective: 'Compare characters at matching positions from the start and end of a word.', stdin: 'madam', expectedOutput: 'Palindrome',
    sourceCode: `#include <stdio.h>
#include <string.h>

int main(void) {
    char word[100];
    if (scanf("%99s", word) != 1) return 1;
    int left = 0;
    int right = (int)strlen(word) - 1;
    int same = 1;
    while (left < right) {
        if (word[left] != word[right]) same = 0;
        left++;
        right--;
    }
    printf(same ? "Palindrome\\n" : "Not palindrome\\n");
    return 0;
}`,
  },
  {
    id: 'c-pointer-swap', title: 'Swap using pointers', language: 'c', subject: 'Programming in C', topic: 'Pointers', level: 'intermediate',
    objective: 'Pass addresses to a function so it can change two caller variables.', stdin: '4 9', expectedOutput: '9 4',
    sourceCode: `#include <stdio.h>

void swap(int *left, int *right) {
    int temp = *left;
    *left = *right;
    *right = temp;
}

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 1;
    swap(&a, &b);
    printf("%d %d\\n", a, b);
    return 0;
}`,
  },
  {
    id: 'c-structure-result', title: 'Student result with a structure', language: 'c', subject: 'Programming in C', topic: 'Structures', level: 'intermediate',
    objective: 'Group a student identifier and marks in a structure and calculate a total.', stdin: '104 78 82 91', expectedOutput: 'Student: 104\nTotal: 251\nAverage: 83.67',
    sourceCode: `#include <stdio.h>

typedef struct {
    int id;
    float first;
    float second;
    float third;
} Student;

int main(void) {
    Student student;
    if (scanf("%d %f %f %f", &student.id, &student.first, &student.second, &student.third) != 4) return 1;
    float total = student.first + student.second + student.third;
    printf("Student: %d\\n", student.id);
    printf("Total: %.0f\\nAverage: %.2f\\n", total, total / 3.0f);
    return 0;
}`,
  },
  {
    id: 'c-recursive-factorial', title: 'Factorial with recursion', language: 'c', subject: 'Programming in C', topic: 'Recursion', level: 'intermediate',
    objective: 'Use a base case and a smaller recursive problem to calculate factorial.', stdin: '6', expectedOutput: '720',
    sourceCode: `#include <stdio.h>

unsigned long long factorial(int n) {
    if (n <= 1) return 1;
    return (unsigned long long)n * factorial(n - 1);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 0 || n > 20) return 1;
    printf("%llu\\n", factorial(n));
    return 0;
}`,
  },
  {
    id: 'c-function-sum', title: 'Sum with a function', language: 'c', subject: 'Programming in C', topic: 'Functions', level: 'beginner',
    objective: 'Separate a calculation into a function with parameters and a return value.', stdin: '18 24', expectedOutput: 'Sum: 42',
    sourceCode: `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main(void) {
    int first, second;
    if (scanf("%d %d", &first, &second) != 2) return 1;
    printf("Sum: %d\\n", add(first, second));
    return 0;
}`,
  },
  {
    id: 'cpp-student-class', title: 'Student class and average', language: 'cpp', subject: 'Object-Oriented Programming', topic: 'Classes and objects', level: 'beginner',
    objective: 'Create an object that stores marks and exposes a method to calculate the average.', stdin: '75 80 95', expectedOutput: 'Average: 83.33',
    sourceCode: `#include <iomanip>
#include <iostream>
using namespace std;

class Student {
public:
    double first, second, third;
    Student(double a, double b, double c) : first(a), second(b), third(c) {}
    double average() const { return (first + second + third) / 3.0; }
};

int main() {
    double a, b, c;
    if (!(cin >> a >> b >> c)) return 1;
    Student student(a, b, c);
    cout << fixed << setprecision(2) << "Average: " << student.average() << '\\n';
    return 0;
}`,
  },
  {
    id: 'cpp-function-overloading', title: 'Function overloading', language: 'cpp', subject: 'Object-Oriented Programming', topic: 'Overloading', level: 'beginner',
    objective: 'Use one function name with distinct parameter types to calculate an area.', stdin: '5 2.5', expectedOutput: 'Square area: 25\nCircle area: 19.63',
    sourceCode: `#include <iomanip>
#include <iostream>
using namespace std;

int area(int side) { return side * side; }
double area(double radius) { return 3.14159 * radius * radius; }

int main() {
    int side;
    double radius;
    if (!(cin >> side >> radius)) return 1;
    cout << "Square area: " << area(side) << '\\n';
    cout << fixed << setprecision(2) << "Circle area: " << area(radius) << '\\n';
    return 0;
}`,
  },
  {
    id: 'cpp-inheritance-salary', title: 'Inheritance and salary', language: 'cpp', subject: 'Object-Oriented Programming', topic: 'Inheritance', level: 'intermediate',
    objective: 'Extend an employee base class with a bonus calculation.', stdin: '30000 5000', expectedOutput: 'Total pay: 35000',
    sourceCode: `#include <iostream>
using namespace std;

class Employee {
protected:
    int salary;
public:
    explicit Employee(int value) : salary(value) {}
};

class Manager : public Employee {
    int bonus;
public:
    Manager(int value, int extra) : Employee(value), bonus(extra) {}
    int totalPay() const { return salary + bonus; }
};

int main() {
    int salary, bonus;
    if (!(cin >> salary >> bonus)) return 1;
    Manager manager(salary, bonus);
    cout << "Total pay: " << manager.totalPay() << '\\n';
    return 0;
}`,
  },
  {
    id: 'cpp-runtime-polymorphism', title: 'Runtime polymorphism', language: 'cpp', subject: 'Object-Oriented Programming', topic: 'Virtual functions', level: 'intermediate',
    objective: 'Call an overridden method through a base-class reference.', stdin: '', expectedOutput: 'Circle area: 12.57',
    sourceCode: `#include <iomanip>
#include <iostream>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
    double radius;
public:
    explicit Circle(double value) : radius(value) {}
    double area() const override { return 3.14159 * radius * radius; }
};

int main() {
    Circle circle(2.0);
    const Shape& shape = circle;
    cout << fixed << setprecision(2) << "Circle area: " << shape.area() << '\\n';
    return 0;
}`,
  },
  {
    id: 'cpp-exception-division', title: 'Exception handling', language: 'cpp', subject: 'Object-Oriented Programming', topic: 'Exceptions', level: 'intermediate',
    objective: 'Detect invalid input and handle division by zero with an exception.', stdin: '20 0', expectedOutput: 'Error: division by zero',
    sourceCode: `#include <iostream>
#include <stdexcept>
using namespace std;

int main() {
    int numerator, denominator;
    if (!(cin >> numerator >> denominator)) return 1;
    try {
        if (denominator == 0) throw runtime_error("division by zero");
        cout << numerator / denominator << '\\n';
    } catch (const exception& error) {
        cout << "Error: " << error.what() << '\\n';
    }
    return 0;
}`,
  },
  {
    id: 'cpp-vector-sort', title: 'Sort a vector', language: 'cpp', subject: 'Data Structures', topic: 'STL vector and sorting', level: 'beginner',
    objective: 'Read values into a vector and sort them with the standard library.', stdin: '5\n9 2 7 1 5', expectedOutput: '1 2 5 7 9',
    sourceCode: `#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n) || n < 1 || n > 100) return 1;
    vector<int> values(n);
    for (int& value : values) if (!(cin >> value)) return 1;
    sort(values.begin(), values.end());
    for (int i = 0; i < n; i++) cout << values[i] << (i + 1 == n ? '\\n' : ' ');
    return 0;
}`,
  },
  {
    id: 'cpp-map-frequency', title: 'Count values with a map', language: 'cpp', subject: 'Data Structures', topic: 'Associative containers', level: 'intermediate',
    objective: 'Use a map to count how often each integer occurs.', stdin: '7\n2 1 2 3 1 2 3', expectedOutput: '1: 2\n2: 3\n3: 2',
    sourceCode: `#include <iostream>
#include <map>
using namespace std;

int main() {
    int n;
    if (!(cin >> n) || n < 1 || n > 100) return 1;
    map<int, int> counts;
    for (int i = 0; i < n; i++) {
        int value;
        if (!(cin >> value)) return 1;
        counts[value]++;
    }
    for (const auto& entry : counts)
        cout << entry.first << ": " << entry.second << '\\n';
    return 0;
}`,
  },
  {
    id: 'java-student-result', title: 'Student result class', language: 'java', subject: 'Object-Oriented Programming with Java', topic: 'Classes and objects', level: 'beginner',
    objective: 'Create a Java object and use a method to calculate the total marks.', stdin: '78 82 91', expectedOutput: 'Total: 251\nAverage: 83.67',
    sourceCode: `import java.util.Scanner;

class Student {
    int first;
    int second;
    int third;

    Student(int a, int b, int c) {
        first = a;
        second = b;
        third = c;
    }

    int total() { return first + second + third; }
    double average() { return total() / 3.0; }
}

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        Student student = new Student(input.nextInt(), input.nextInt(), input.nextInt());
        System.out.println("Total: " + student.total());
        System.out.printf("Average: %.2f%n", student.average());
    }
}`,
  },
  {
    id: 'java-inheritance', title: 'Inheritance and method override', language: 'java', subject: 'Object-Oriented Programming with Java', topic: 'Inheritance', level: 'intermediate',
    objective: 'Override a method in a subclass and call it through a base-class reference.', stdin: '', expectedOutput: 'Student portal access',
    sourceCode: `class User {
    void describe() { System.out.println("General account"); }
}

class Student extends User {
    @Override
    void describe() { System.out.println("Student portal access"); }
}

public class Main {
    public static void main(String[] args) {
        User user = new Student();
        user.describe();
    }
}`,
  },
  {
    id: 'java-overloading', title: 'Method overloading', language: 'java', subject: 'Object-Oriented Programming with Java', topic: 'Methods', level: 'beginner',
    objective: 'Overload a method to accept either two or three integer values.', stdin: '12 8 5', expectedOutput: 'Sum of two: 20\nSum of three: 25',
    sourceCode: `import java.util.Scanner;

public class Main {
    static int sum(int a, int b) { return a + b; }
    static int sum(int a, int b, int c) { return a + b + c; }

    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int a = input.nextInt();
        int b = input.nextInt();
        int c = input.nextInt();
        System.out.println("Sum of two: " + sum(a, b));
        System.out.println("Sum of three: " + sum(a, b, c));
    }
}`,
  },
  {
    id: 'java-safe-division', title: 'Handle division errors', language: 'java', subject: 'Object-Oriented Programming with Java', topic: 'Exceptions', level: 'beginner',
    objective: 'Catch an arithmetic exception and print a learner-friendly message.', stdin: '20 0', expectedOutput: 'Cannot divide by zero',
    sourceCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int numerator = input.nextInt();
        int denominator = input.nextInt();
        try {
            System.out.println(numerator / denominator);
        } catch (ArithmeticException error) {
            System.out.println("Cannot divide by zero");
        }
    }
}`,
  },
  {
    id: 'java-arraylist-sort', title: 'Sort an ArrayList', language: 'java', subject: 'Data Structures', topic: 'Collections', level: 'beginner',
    objective: 'Use an ArrayList and Collections.sort to order a small list of integers.', stdin: '5\n9 2 7 1 5', expectedOutput: '1 2 5 7 9',
    sourceCode: `import java.util.ArrayList;
import java.util.Collections;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        ArrayList<Integer> values = new ArrayList<>();
        for (int i = 0; i < n; i++) values.add(input.nextInt());
        Collections.sort(values);
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(values.get(i));
        }
        System.out.println();
    }
}`,
  },
  {
    id: 'python-list-statistics', title: 'List minimum and maximum', language: 'python', subject: 'Programming with Python', topic: 'Lists', level: 'beginner',
    objective: 'Read numbers into a list and use built-in functions to find its range.', stdin: '5\n8 3 11 2 6', expectedOutput: 'Minimum: 2\nMaximum: 11',
    sourceCode: `count = int(input())
values = list(map(int, input().split()))
if len(values) != count:
    raise ValueError("Enter exactly count values")
print(f"Minimum: {min(values)}")
print(f"Maximum: {max(values)}")`,
  },
  {
    id: 'python-primes-to-n', title: 'Prime numbers up to n', language: 'python', subject: 'Programming with Python', topic: 'Loops and functions', level: 'beginner',
    objective: 'Print all primes not greater than the input using trial division.', stdin: '20', expectedOutput: '2 3 5 7 11 13 17 19',
    sourceCode: `limit = int(input())
primes = []
for number in range(2, limit + 1):
    is_prime = True
    for divisor in range(2, int(number ** 0.5) + 1):
        if number % divisor == 0:
            is_prime = False
            break
    if is_prime:
        primes.append(number)
print(*primes)`,
  },
  {
    id: 'python-string-palindrome', title: 'Palindrome string', language: 'python', subject: 'Programming with Python', topic: 'Strings', level: 'beginner',
    objective: 'Compare a word with its reversed slice.', stdin: 'level', expectedOutput: 'Palindrome',
    sourceCode: `word = input().strip()
if word == word[::-1]:
    print("Palindrome")
else:
    print("Not palindrome")`,
  },
  {
    id: 'python-fibonacci-recursion', title: 'Fibonacci with recursion', language: 'python', subject: 'Programming with Python', topic: 'Recursion', level: 'intermediate',
    objective: 'Define a recursive function and print the first n values.', stdin: '7', expectedOutput: '0 1 1 2 3 5 8',
    sourceCode: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

count = int(input())
print(*(fibonacci(index) for index in range(count)))`,
  },
  {
    id: 'python-word-frequency', title: 'Word frequency with a dictionary', language: 'python', subject: 'Programming with Python', topic: 'Dictionaries', level: 'intermediate',
    objective: 'Count words with a dictionary and print each word in alphabetical order.', stdin: 'red blue red green blue red', expectedOutput: 'blue: 2\ngreen: 1\nred: 3',
    sourceCode: `words = input().lower().split()
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
for word in sorted(counts):
    print(f"{word}: {counts[word]}")`,
  },
]

export function findCodingLabProgram(id: string): CodingLabProgram | undefined {
  return CODING_LAB_PROGRAMS.find((program) => program.id === id)
}

export function starterPrograms(language: CodingLanguage): CodingLabProgram[] {
  return CODING_LAB_PROGRAMS.filter((program) => program.language === language)
}

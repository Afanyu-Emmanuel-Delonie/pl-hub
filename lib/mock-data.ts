import type {
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  BonusAward,
  CAWeights,
  Quiz,
  QuizResponse,
  Student,
} from "./types";

export const GROUPS = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Group E",
  "Group F",
  "Group G",
  "Group H",
  "Group I",
];

export const STUDENTS: Student[] = [
  { id: "S001", name: "Amara Chen", group: "Group A" },
  { id: "S002", name: "Diego Ferreira", group: "Group A" },
  { id: "S003", name: "Priya Nair", group: "Group A" },
  { id: "S004", name: "Liam O'Connor", group: "Group B" },
  { id: "S005", name: "Yuki Tanaka", group: "Group B" },
  { id: "S006", name: "Fatima Al-Sayed", group: "Group B" },
  { id: "S007", name: "Marcus Webb", group: "Group C" },
  { id: "S008", name: "Elena Popescu", group: "Group C" },
];

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "PLSQL Assignment One — Sunrise Supermarket",
    instructions: [
      "Include a README.md with your name, Student ID, a short summary of what you did, and how to run it.",
      "Your repo should be named assignment_1_your_name-your_id and must be pushed by the deadline.",
      "You may use any SQL/DBMS tool (Oracle, PostgreSQL, MySQL, SQL Server, etc.) — note which one you used in your README.",
    ],
    content: [
      {
        id: "b1",
        type: "text",
        value:
          "Sunrise Supermarket sells products to customers, who place orders containing one or more items. Management wants to understand who their customers are, what they buy, and how sales are trending over time.\n\nPopulate each table with realistic sample data: at least 5 customers, 8 products (across at least 3 categories), 15 orders, and 25 order items, spread across multiple dates so trends are visible.",
      },
      {
        id: "b2",
        type: "code",
        language: "SQL",
        value:
`CREATE TABLE customers (
  customer_id   NUMBER PRIMARY KEY,
  customer_name VARCHAR2(100),
  email         VARCHAR2(100),
  city          VARCHAR2(50)
);

CREATE TABLE products (
  product_id    NUMBER PRIMARY KEY,
  product_name  VARCHAR2(100),
  category      VARCHAR2(50),
  price         NUMBER(10,2)
);

CREATE TABLE orders (
  order_id      NUMBER PRIMARY KEY,
  customer_id   NUMBER REFERENCES customers(customer_id),
  order_date    DATE
);

CREATE TABLE order_items (
  order_item_id NUMBER PRIMARY KEY,
  order_id      NUMBER REFERENCES orders(order_id),
  product_id    NUMBER REFERENCES products(product_id),
  quantity      NUMBER
);`,
      },
      {
        id: "b3",
        type: "question",
        text: "Basic Joins",
        subQuestions: [
          "List every order with the customer's name and city, and the order date. (INNER JOIN: orders + customers)",
          "List every order item with the product name, category, price, and quantity ordered. (JOIN: order_items + products)",
          "List all customers and, where they exist, their orders — including customers who have never placed an order. (LEFT JOIN: customers + orders)",
        ],
      },
      {
        id: "b4",
        type: "question",
        text: "Aggregation & CTEs",
        subQuestions: [
          "Calculate each customer's total amount spent (quantity × price, summed across all their order items), then return only customers who have spent above the average customer spend. (Use a CTE to compute per-customer totals first, then filter against the average in the main query.)",
        ],
      },
      {
        id: "b5",
        type: "question",
        text: "Window Functions",
        subQuestions: [
          "Rank customers by total amount spent, highest first.",
          "Number each customer's orders in the order they were placed.",
          "Show a running total of revenue over time, ordered by order date.",
          "For each customer with more than one order, show how many days passed between their current and previous order.",
        ],
      },
    ],
    deadlines: [
      { groups: ["Group B", "Group C", "Group I"], deadline: "2026-09-21T23:59:00" },
      { groups: ["Group D"], deadline: "2026-09-23T23:59:00" },
    ],
    maxScore: 20,
    closedGroups: [],
    createdAt: "2026-08-28T09:00:00",
  },
  {
    id: "a2",
    title: "Assignment 2 — Query Optimization",
    instructions: ["Profile and optimize the three slow queries provided in the handout."],
    content: [],
    deadlines: [{ groups: [...GROUPS], deadline: "2026-09-12T23:59:00" }],
    maxScore: 20,
    closedGroups: [],
    createdAt: "2026-09-05T09:00:00",
  },
];

export function addAssignment(assignment: Assignment) {
  ASSIGNMENTS.unshift(assignment);
}

export function updateAssignment(updated: Assignment) {
  const idx = ASSIGNMENTS.findIndex((a) => a.id === updated.id);
  if (idx !== -1) ASSIGNMENTS[idx] = updated;
}

export function setAssignmentClosedGroups(id: string, closedGroups: string[]) {
  const a = ASSIGNMENTS.find((a) => a.id === id);
  if (a) a.closedGroups = closedGroups;
}

export function addQuiz(quiz: Quiz) {
  QUIZZES.unshift(quiz);
}

export function updateQuiz(updated: Quiz) {
  const idx = QUIZZES.findIndex((q) => q.id === updated.id);
  if (idx !== -1) QUIZZES[idx] = updated;
}

export function setQuizClosedGroups(id: string, closedGroups: string[]) {
  const q = QUIZZES.find((q) => q.id === id);
  if (q) q.closedGroups = closedGroups;
}

export const ASSIGNMENT_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: "a1__S001",
    assignmentId: "a1",
    studentId: "S001",
    studentName: "Amara Chen",
    group: "Group A",
    githubLink: "https://github.com/amarachen/data-modeling",
    submittedAt: "2026-09-09T18:12:00",
    late: false,
    graded: true,
    score: 18,
    maxScore: 20,
    comment: "Clean normalization, good ER diagram.",
  },
  {
    id: "a1__S002",
    assignmentId: "a1",
    studentId: "S002",
    studentName: "Diego Ferreira",
    group: "Group A",
    githubLink: "https://github.com/dferreira/assignment1",
    submittedAt: "2026-09-11T02:40:00",
    late: true,
    graded: true,
    score: 14,
    maxScore: 20,
    comment: "Late submission. Missing 3NF on orders table.",
  },
  {
    id: "a1__S004",
    assignmentId: "a1",
    studentId: "S004",
    studentName: "Liam O'Connor",
    group: "Group B",
    githubLink: "https://github.com/loconnor/db-assignment-1",
    submittedAt: "2026-09-10T14:05:00",
    late: false,
    graded: false,
    score: null,
    maxScore: 20,
    comment: "",
  },
  {
    id: "a1__S007",
    assignmentId: "a1",
    studentId: "S007",
    studentName: "Marcus Webb",
    group: "Group C",
    githubLink: "https://github.com/mwebb/coursework",
    submittedAt: "2026-09-10T21:50:00",
    late: false,
    graded: false,
    score: null,
    maxScore: 20,
    comment: "",
  },
  {
    id: "a2__S001",
    assignmentId: "a2",
    studentId: "S001",
    studentName: "Amara Chen",
    group: "Group A",
    githubLink: "https://github.com/amarachen/query-optimization",
    submittedAt: "2026-09-19T20:00:00",
    late: false,
    graded: false,
    score: null,
    maxScore: 20,
    comment: "",
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Quiz 1 — Normalization",
    deadline: "2026-09-08T23:59:00",
    groups: [],
    closedGroups: [],
    createdAt: "2026-09-01T09:00:00",
    questions: [
      {
        id: "q1-1",
        type: "multiple-choice",
        text: "Which normal form eliminates transitive dependencies?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctIndexes: [2],
      },
      {
        id: "q1-2",
        type: "multiple-choice",
        text: "A composite key is made up of:",
        options: ["A single unique column", "Two or more columns together", "A foreign key only", "An index"],
        correctIndexes: [1],
      },
    ],
  },
  {
    id: "q2",
    title: "Quiz 2 — Indexing & Joins",
    deadline: "2026-09-18T23:59:00",
    groups: [],
    closedGroups: [],
    createdAt: "2026-09-11T09:00:00",
    questions: [
      {
        id: "q2-1",
        type: "multiple-choice",
        text: "A B-tree index is most effective for:",
        options: ["Equality and range queries", "Full-text search only", "Unordered scans", "Storing blobs"],
        correctIndexes: [0],
      },
      {
        id: "q2-2",
        type: "multi-select",
        text: "Which of the following are valid JOIN types in SQL? (select all that apply)",
        options: ["INNER JOIN", "OUTER JOIN", "CROSS JOIN", "DIAGONAL JOIN", "LEFT JOIN"],
        correctIndexes: [0, 1, 2, 4],
      },
      {
        id: "q2-3",
        type: "true-false",
        text: "A clustered index physically reorders the rows in a table.",
        options: ["True", "False"],
        correctIndexes: [0],
      },
    ],
  },
];

export const QUIZ_RESPONSES: QuizResponse[] = [
  {
    id: "q1__S001",
    quizId: "q1",
    studentId: "S001",
    studentName: "Amara Chen",
    group: "Group A",
    score: 2,
    maxScore: 2,
    submittedAt: "2026-09-07T10:15:00",
    late: false,
  },
  {
    id: "q1__S002",
    quizId: "q1",
    studentId: "S002",
    studentName: "Diego Ferreira",
    group: "Group A",
    score: 1,
    maxScore: 2,
    submittedAt: "2026-09-07T11:02:00",
    late: false,
  },
  {
    id: "q1__S004",
    quizId: "q1",
    studentId: "S004",
    studentName: "Liam O'Connor",
    group: "Group B",
    score: 2,
    maxScore: 2,
    submittedAt: "2026-09-08T09:30:00",
    late: false,
  },
  {
    id: "q1__S005",
    quizId: "q1",
    studentId: "S005",
    studentName: "Yuki Tanaka",
    group: "Group B",
    score: 1,
    maxScore: 2,
    submittedAt: "2026-09-08T22:50:00",
    late: false,
  },
  {
    id: "q1__S007",
    quizId: "q1",
    studentId: "S007",
    studentName: "Marcus Webb",
    group: "Group C",
    score: 0,
    maxScore: 2,
    submittedAt: "2026-09-09T08:00:00",
    late: true,
  },
  {
    id: "q2__S001",
    quizId: "q2",
    studentId: "S001",
    studentName: "Amara Chen",
    group: "Group A",
    score: 1,
    maxScore: 1,
    submittedAt: "2026-09-17T13:00:00",
    late: false,
  },
  {
    id: "q2__S002",
    quizId: "q2",
    studentId: "S002",
    studentName: "Diego Ferreira",
    group: "Group A",
    score: 1,
    maxScore: 1,
    submittedAt: "2026-09-17T13:20:00",
    late: false,
  },
  {
    id: "q2__S006",
    quizId: "q2",
    studentId: "S006",
    studentName: "Fatima Al-Sayed",
    group: "Group B",
    score: 1,
    maxScore: 1,
    submittedAt: "2026-09-18T19:40:00",
    late: false,
  },
];

export const BONUS_AWARDS: BonusAward[] = [
  {
    id: "b1",
    studentId: "S007",
    studentName: "Marcus Webb",
    group: "Group C",
    points: 2,
    reason: "Outstanding participation in lab discussion",
    awardedAt: "2026-09-11T15:00:00",
  },
];

// Logged once at the end of the semester from the school's attendance system.
export const ATTENDANCE: AttendanceRecord[] = [
  { studentId: "S001", percentage: 95 },
  { studentId: "S002", percentage: 80 },
  { studentId: "S004", percentage: 90 },
  { studentId: "S007", percentage: 70 },
];

export const DEFAULT_CA_WEIGHTS: CAWeights = {
  attendance: 10,
  assignments: 40,
  // quizzes get the remaining 50
  totalWeight: 30,
};

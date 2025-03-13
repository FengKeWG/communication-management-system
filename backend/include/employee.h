#ifndef EMPLOYEE_H
#define EMPLOYEE_H

typedef struct Employee
{
    int id;
    char name[100];
    int gender; // 0: 未知, 1: 男, 2: 女
    int birth_year;
    int birth_month;
    int birth_day;
    char email[100];
    int phone_count;
    char phones[100][100];
    int client_ids[100]; // 负责的客户公司ID 数组 (关联客户)
    int client_count;    // 负责的客户数量
    struct Employee *next;
} Employee;

#endif
#ifndef SALES_H
#define SALES_H

typedef struct Sales
{
    int id;
    int user_id;
    char name[100];
    char gender[20];
    int birth_year;
    int birth_month;
    int birth_day;
    char email[100];
    int phone_count;
    char phones[100][100];
    int client_ids[100]; // 负责的客户公司ID 数组 (关联客户)
    int client_count;    // 负责的客户数量
    struct Sales *next;
} Sales;

#endif
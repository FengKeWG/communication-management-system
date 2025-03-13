#ifndef CONTACT_H
#define CONTACT_H

typedef struct Contact
{
    int id;
    char name[100];
    int gender; // 0: 未知, 1: 男, 2: 女
    int birth_year;
    int birth_month;
    int birth_day;
    char email[100];
    int client_id;
    int phone_count;
    char phones[100][100];
    struct Contact *next;
} Contact;

#endif
// 客户公司
#ifndef CLIENT_H
#define CLIENT_H

typedef struct Contact
{
    int id;
    char name[100];
    char gender[10];
    int birth_year;
    int birth_month;
    int birth_day;
    char email[100];
    int phone_count;
    char phones[100][100];
} Contact;

typedef struct Client
{
    int id;
    char name[100];
    char region[100];
    char address[100];
    char legal_person[100];
    int size;
    int contact_level;
    char email[100];
    int phone_count;
    char phones[100][100];
    int contact_count;
    Contact contacts[100]; // 联络员Z
    struct Client *next;
} Client;

#endif
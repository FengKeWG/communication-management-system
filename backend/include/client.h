// 客户公司
#ifndef CLIENT_H
#define CLIENT_H

typedef struct Client
{
    int id;
    int contact_count;
    int contact_id[100]; // 联络员
    char name[100];
    char region[100];
    char address[100];
    char legal_person[100];
    int size;
    int contact_level;
    char email[100];
    int phone_count;
    char phones[100][100];
    struct Client *next;
} Client;

#endif
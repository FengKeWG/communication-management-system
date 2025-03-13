// 客户公司

#ifndef CLIENT_H
#define CLIENT_H

typedef struct
{
    int id;
    int contact_count;
    int contact_id[100]; // 联络员
    char name[100];
    char region[100];
    char legal_person[100];
    int size;
    int contact_level;
    char email[100];
    int phone_count;
    char phones[100][100];
    struct Client *next;
} Client;

extern Client *client_head; // extern 只 声明变量，不会创建存储空间，实际变量通过 client_manager.c 定义

#endif
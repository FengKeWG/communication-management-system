#ifndef USER_H
#define USER_H

typedef struct User
{
    int id;
    char username[50];
    char password_hash[65]; // SHA256哈希值
    char role[10];          // "manager", "employee"
    struct User *next;
} User;

#endif
#ifndef USER_H
#define USER_H

typedef struct User
{
    char username[50];
    char password_hash[65]; // SHA256哈希值
    char role[10];          // "admin", "manager", "employee"
    struct User *next;
} User;

#endif
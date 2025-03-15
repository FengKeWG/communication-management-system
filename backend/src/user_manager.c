#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "user_manager.h"
#include "utils.c"

User *parseUserFromArgs(int argc, char *argv[])
{
    User *newUser = (User *)malloc(sizeof(User));
    if (!newUser)
    {
        perror("内存分配失败！");
        return NULL;
    }
    memset(newUser, 0, sizeof(User));

    const char *password = argv[3];
    char password_hash[65];
    hashPassword(password, password_hash);
    strncpy(newUser->username, argv[2], sizeof(newUser->username) - 1);
    strncpy(newUser->password_hash, password_hash, sizeof(newUser->password_hash) - 1);
    strncpy(newUser->role, argv[4], sizeof(newUser->role) - 1);

    return newUser;
}

User *authenticateUser(User *userList, const char *username, const char *password)
{
    User *current = userList;
    char password_hash[65];
    hashPassword(password, password_hash);
    while (current)
    {
        if (strcmp(current->username, username) == 0 && strcmp(current->password_hash, password_hash) == 0)
        {
            return current;
        }
        current = current->next;
    }
    return NULL;
}

User *addUser(User *head, User *newUser)
{
    if (!newUser)
    {
        perror("无效");
        return head;
    }
    if (head)
    {
        User *current = head;
        while (current->next)
        {
            current = current->next;
        }
        current->next = newUser;
    }
    else
    {
        head = newUser;
    }

    printf("账号 '%s' 添加成功！\n", newUser->username);
    return head;
}
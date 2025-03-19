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

    if (debug)
        fprintf(stderr, "调试信息: 开始认证 - 用户名 '%s', 密码哈希 '%s'\n", username, password_hash);

    while (current)
    {
        if (debug)
            fprintf(stderr, "调试信息: 检查用户 - 用户名 '%s', 存储的密码哈希 '%s'\n",
                    current->username, current->password_hash);

        if (strcmp(current->username, username) == 0 && strcmp(current->password_hash, password_hash) == 0)
        {
            if (debug)
                fprintf(stderr, "调试信息: 认证成功 - 用户名 '%s'\n", username);
            return current;
        }
        current = current->next;
    }

    if (debug)
        fprintf(stderr, "调试信息: 认证失败 - 未找到匹配的用户\n");
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
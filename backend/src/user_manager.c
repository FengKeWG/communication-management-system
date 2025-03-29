#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "user_manager.h"
#include "utils.c"

User *parseUserFromString(char *userString, bool newID, bool hash)
{
    User *newUser = (User *)malloc(sizeof(User));
    if (!newUser)
        return NULL;
    memset(newUser, 0, sizeof(User));

    char idStr[50] = {0};
    char password[256] = {0};

    int scanned = sscanf(userString, "%[^,],%[^,],%[^,],%[^,]", idStr, newUser->username, password, newUser->role);
    if (scanned < 4)
    {
        free(newUser);
        return NULL;
    }
    newUser->id = newID ? uidGenerate() : stoi(idStr);
    if (hash)
        hashPassword(password, newUser->password_hash);
    else
        scpy(newUser->password_hash, password, sizeof(newUser->password_hash));
    return newUser;
}

User *authenticateUser(User *userList, char *username, char *password)
{
    User *current = userList;
    char password_hash[65];
    hashPassword(password, password_hash);
    while (current)
    {
        if (strcmp(current->username, username) == 0 && strcmp(current->password_hash, password_hash) == 0)
            return current;
        current = current->next;
    }
    return NULL;
}

User *addUser(User *head, User *newUser)
{
    if (!newUser)
        return head;
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
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

    int scanned = sscanf(userString, "%[^;];%[^;];%[^;];%[^;]", idStr, newUser->username, password, newUser->role);
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

User *deleteUser(User *head, int id)
{
    User *current = head;
    User *prev = NULL;
    while (current && current->id != id)
    {
        prev = current;
        current = current->next;
    }
    if (!current)
    {
        return head;
    }
    if (!prev)
    {
        head = current->next;
    }
    else
    {
        prev->next = current->next;
    }
    free(current);
    return head;
}

User *modifyUser(User *head, User *newUser)
{
    if (head == NULL)
        return newUser;
    User *current = head;
    User *prev = NULL;
    while (current != NULL)
    {
        if (current->id == newUser->id)
        {
            if (current == head)
            {
                newUser->next = current->next;
                free(current);
                return newUser;
            }
            else
            {
                prev->next = newUser;
                newUser->next = current->next;
                free(current);
                return head;
            }
        }
        prev = current;
        current = current->next;
    }
    return head;
}

int cmpUser(User *a, User *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->username, b->username);
    case 3:
        return strcmp(a->role, b->role);
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->username, a->username);
    case -3:
        return strcmp(b->role, a->role);
    default:
        return 0;
    }
}

User *mergeUserSortedLists(User *list1, User *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    User *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmpUser(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeUserSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmpUser(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeUserSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeUserSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitUserList(User *head, User **front, User **back)
{
    User *slow = head;
    User *fast = head->next;
    while (fast)
    {
        fast = fast->next;
        if (fast)
        {
            slow = slow->next;
            fast = fast->next;
        }
    }
    *front = head;
    *back = slow->next;
    slow->next = NULL;
}

User *mergeSortUser(User *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    User *front = NULL;
    User *back = NULL;
    splitUserList(head, &front, &back);
    front = mergeSortUser(front, cnt, a);
    back = mergeSortUser(back, cnt, a);
    return mergeUserSortedLists(front, back, cnt, a);
}

void displayUsers(User *head, int argc, char *argv[])
{
    if (argc < 3)
        return;
    if (argc == 3)
    {
        argc++;
        argv[3] = "1";
    }
    int cnt = argc - 3;
    int a[cnt];
    for (int i = 0; i < cnt; i++)
        a[i] = stoi(argv[3 + i]);
    head = mergeSortUser(head, cnt, a);
    char pattern[10000] = "";
    strcat(pattern, argv[2]);
    toLower(pattern);
    User *current = head;
    char text[15000];
    char tmp[200];
    while (current)
    {
        text[0] = '\0';
        snprintf(tmp, sizeof(tmp), "%d", current->id);
        strcat(text, tmp);
        strcat(text, current->username);
        strcat(text, current->role);
        toLower(text);
        if (strlen(pattern) == 0 || kmp(text, pattern) >= 0)
        {
            printf("%d;%s;%s;%s\n", current->id, current->username, current->password_hash, current->role);
        }
        current = current->next;
    }
    fflush(stdout);
}
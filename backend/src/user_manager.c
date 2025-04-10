#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "user_manager.h"
#include "utils.c"

User *parseUserFromString(char *inputString, bool newID, bool hashPasswordOnParse)
{
    User *newUser = (User *)malloc(sizeof(User));
    if (!newUser)
        return NULL;
    memset(newUser, 0, sizeof(User));
    newUser->sales_id = 0;
    char idStr[50] = {0};
    char password[256] = {0};
    char salesIdStr[50] = {0};
    int scanned = sscanf(inputString, "%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\n]", idStr, newUser->username, password, newUser->role, salesIdStr);
    if (scanned < 3)
    {
        fprintf(stderr, "解析用户数据失败，格式不正确: %s\n", inputString);
        free(newUser);
        return NULL;
    }
    newUser->id = newID ? uidGenerate() : stoi(idStr);
    if (strlen(password) > 0)
    {
        if (hashPasswordOnParse)
            hashPassword(password, newUser->password_hash);
        else
            scpy(newUser->password_hash, password, sizeof(newUser->password_hash));
    }
    else if (newID)
    {
        fprintf(stderr, "添加新用户 %s 时必须提供密码\n", newUser->username);
        free(newUser);
        return NULL;
    }
    if (strlen(salesIdStr) > 0)
        newUser->sales_id = stoi(salesIdStr);
    else
    {
        if (strcmp(newUser->role, "manager") == 0)
            newUser->sales_id = 0;
        else
        {
            fprintf(stderr, "用户 %s 角色为 sales 但未提供 sales_id\n", newUser->username);
            free(newUser);
            return NULL;
        }
    }
    newUser->next = NULL;
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
    fprintf(stderr, "用户名或密码错误\n");
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
    if (!head || !newUser)
        return head;
    User *current = head;
    User *prev = NULL;
    while (current != NULL)
    {
        if (current->id == newUser->id)
        {
            scpy(current->username, newUser->username, sizeof(current->username));
            scpy(current->role, newUser->role, sizeof(current->role));
            current->sales_id = newUser->sales_id;
            if (strlen(newUser->password_hash) > 0 && strcmp(newUser->password_hash, current->password_hash) != 0)
            {
                scpy(current->password_hash, newUser->password_hash, sizeof(current->password_hash));
                printf("用户 %s 的密码已更新\n", current->username);
            }
            return head;
        }
        prev = current;
        current = current->next;
    }
    fprintf(stderr, "未找到要修改的用户 ID: %d\n", newUser->id);
    free(newUser);
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

void displayUsers(User *head, const char *pattern, int *sortKeys, int sortKeyCount)
{
    if (sortKeyCount > 0 && sortKeys != NULL)
    {
        head = mergeSortUser(head, sortKeyCount, sortKeys);
    }
    User *current = head;
    char text[15000];
    char tmp[200];
    while (current)
    {
        text[0] = '\0';
        snprintf(tmp, sizeof(tmp), "%d", current->id);
        strcat(text, tmp);
        strncat(text, current->username, sizeof(text) - strlen(text) - 1);
        strncat(text, current->role, sizeof(text) - strlen(text) - 1);
        toLower(text);
        if (strlen(pattern) == 0 || kmp(text, pattern) >= 0)
            printf("%d\x1C%s\x1C%s\x1C%s\x1C%d\n", current->id, current->username, "***", current->role, current->sales_id);
        current = current->next;
    }
}

int changeUserPassword(User *head, const char *username, const char *oldPassword, const char *newPassword, const char *confirmPassword)
{
    if (!head || !username || !oldPassword || !newPassword || !confirmPassword)
    {
        fprintf(stderr, "changeUserPassword: 函数接收到无效参数\n");
        return -1;
    }

    if (strcmp(newPassword, confirmPassword) != 0)
    {
        fprintf(stderr, "用户 '%s' 的新密码与确认密码不匹配\n", username);
        return -6;
    }

    if (strlen(newPassword) == 0)
    {
        fprintf(stderr, "新密码不能为空\n");
        return -2;
    }
    if (strlen(newPassword) < 6)
    {
        fprintf(stderr, "新密码长度不能少于6位\n");
        return -3;
    }

    User *current = head;
    char oldPasswordHash[65];
    char newPasswordHash[65];

    hashPassword(oldPassword, oldPasswordHash);

    while (current)
    {
        if (strcmp(current->username, username) == 0)
        {
            if (strcmp(current->password_hash, oldPasswordHash) == 0)
            {
                hashPassword(newPassword, newPasswordHash);
                if (strcmp(current->password_hash, newPasswordHash) == 0)
                {
                    fprintf(stderr, "用户 '%s' 的新密码不能与旧密码相同\n", username);
                    return -7;
                }
                scpy(current->password_hash, newPasswordHash, sizeof(current->password_hash));
                printf("用户 '%s' 的密码已成功修改\n", username);
                return 0;
            }
            else
            {
                fprintf(stderr, "用户 '%s' 的旧密码不正确\n", username);
                return -4;
            }
        }
        current = current->next;
    }
    fprintf(stderr, "未找到用户 '%s'\n", username);
    return -5;
}

User *findUserById(User *head, int id)
{
    User *current = head;
    while (current)
    {
        if (current->id == id)
            return current;
        current = current->next;
    }
    return NULL;
}

int verifySalesIdentity(User *userList, Sales *salesList, const char *username, const char *name, int birth_year, int birth_month, int birth_day, const char *email)
{
    if (!userList || !salesList || !username || !name || !email)
        return -1;
    User *user = NULL;
    User *current_user = userList;
    while (current_user)
    {
        if (strcmp(current_user->username, username) == 0)
        {
            user = current_user;
            break;
        }
        current_user = current_user->next;
    }
    if (!user)
    {
        fprintf(stderr, "用户名 '%s' 未找到\n", username);
        return -2;
    }
    if (strcmp(user->role, "sales") != 0)
    {
        fprintf(stderr, "用户 '%s' 不是业务员\n", username);
        return -3;
    }
    Sales *sales = findSalesById(salesList, user->sales_id);
    if (!sales)
    {
        fprintf(stderr, "身份验证失败！\n");
        return -4;
    }
    if (strcmp(sales->name, name) != 0)
    {
        fprintf(stderr, "身份验证失败！\n");
        return -4;
    }
    if (sales->birth_year != birth_year || sales->birth_month != birth_month || sales->birth_day != birth_day)
    {
        fprintf(stderr, "身份验证失败！\n");
        return -4;
    }
    if (strcmp(sales->email, email) != 0)
    {
        fprintf(stderr, "身份验证失败！\n");
        return -4;
    }
    printf("用户 '%s' 身份验证成功\n", username);
    return 0;
}

int resetUserPassword(User *head, const char *username, const char *newPassword)
{
    if (!head || !username || !newPassword)
        return -1;
    if (strlen(newPassword) == 0)
    {
        fprintf(stderr, "新密码不能为空\n");
        return -2;
    }
    User *current = head;
    char newPasswordHash[65];
    while (current)
    {
        if (strcmp(current->username, username) == 0)
        {
            hashPassword(newPassword, newPasswordHash);
            scpy(current->password_hash, newPasswordHash, sizeof(current->password_hash));
            printf("用户 '%s' 的密码已成功重置\n", username);
            return 0;
        }
        current = current->next;
    }
    fprintf(stderr, "未找到用户 '%s'\n", username);
    return -3;
}

char *getPasswordHashById(User *head, int id)
{
    User *current = head;
    while (current != NULL)
    {
        if (current->id == id)
        {
            char *passwordHash = (char *)malloc(strlen(current->password_hash) + 1);
            strcpy(passwordHash, current->password_hash);
            return passwordHash;
        }
        current = current->next;
    }
    return NULL;
}

void freeUserList(User *head)
{
    User *current = head;
    User *next_node;
    while (current)
    {
        next_node = current->next;
        free(current);
        current = next_node;
    }
}
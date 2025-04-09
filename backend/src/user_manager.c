#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "user_manager.h"
#include "utils.c"

User *parseUserFromString(char *userString, bool newID, bool hashPasswordOnParse)
{
    User *newUser = (User *)malloc(sizeof(User));
    if (!newUser)
        return NULL;
    memset(newUser, 0, sizeof(User));
    newUser->sales_id = 0;
    char idStr[50] = {0};
    char password[256] = {0};
    char salesIdStr[50] = {0};
    int scanned = sscanf(userString, "%[^;];%[^;];%[^;];%[^;];%[^\n]", idStr, newUser->username, password, newUser->role, salesIdStr);
    if (scanned >= 4)
    {
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
            fprintf(stderr, "错误: 添加新用户 %s 时必须提供密码。\n", newUser->username);
            free(newUser);
            return NULL;
        }
        if (scanned == 5 && strlen(salesIdStr) > 0)
            newUser->sales_id = stoi(salesIdStr);
        else
        {
            if (strcmp(newUser->role, "manager") == 0)
                newUser->sales_id = 0;
            else
            {
                fprintf(stderr, "警告: 用户 %s 角色为 sales 但未提供 sales_id。\n", newUser->username);
                free(newUser);
                return NULL;
            }
        }
        newUser->next = NULL;
        return newUser;
    }
    else
    {
        fprintf(stderr, "错误: 解析用户数据失败，格式不正确: %s\n", userString);
        free(newUser);
        return NULL;
    }
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

User *modifyUser(User *head, User *updatedUser)
{
    if (!head || !updatedUser)
        return head;
    User *current = head;
    User *prev = NULL;
    while (current != NULL)
    {
        if (current->id == updatedUser->id)
        {
            scpy(current->username, updatedUser->username, sizeof(current->username));
            scpy(current->role, updatedUser->role, sizeof(current->role));
            current->sales_id = updatedUser->sales_id;
            if (strlen(updatedUser->password_hash) > 0 && strcmp(updatedUser->password_hash, current->password_hash) != 0)
            {
                scpy(current->password_hash, updatedUser->password_hash, sizeof(current->password_hash));
                printf("用户 %s 的密码已更新。\n", current->username);
            }
            free(updatedUser);
            return head;
        }
        prev = current;
        current = current->next;
    }
    fprintf(stderr, "错误: 未找到要修改的用户 ID: %d\n", updatedUser->id);
    free(updatedUser);
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
            printf("%d;%s;%s;%s;%d\n", current->id, current->username, "***", current->role, current->sales_id);
        current = current->next;
    }
}

int changeUserPassword(User *head, const char *username, const char *oldPassword, const char *newPassword)
{
    if (!head || !username || !oldPassword || !newPassword)
    {
        fprintf(stderr, "函数接收到无效参数。\n");
        return -1;
    }
    if (strlen(newPassword) == 0)
    {
        fprintf(stderr, "新密码不能为空。\n");
        return 3;
    }
    if (strlen(newPassword) < 6)
    {
        fprintf(stderr, "新密码长度不能少于6位。\n");
        return 4;
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
                scpy(current->password_hash, newPasswordHash, sizeof(current->password_hash));
                printf("用户 '%s' 的密码已成功修改。\n", username);
                return 0;
            }
            else
            {
                fprintf(stderr, "用户 '%s' 的旧密码不正确。\n", username);
                return 2;
            }
        }
        current = current->next;
    }
    fprintf(stderr, "未找到用户 '%s'。\n", username);
    return 1;
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
        return -1; // 基本参数检查

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
        fprintf(stderr, "验证错误: 用户 '%s' 不存在。\n", username);
        return 1; // 用户不存在
    }

    if (strcmp(user->role, "sales") != 0)
    {
        fprintf(stderr, "验证错误: 用户 '%s' 不是业务员角色。\n", username);
        return 2; // 非业务员角色
    }

    if (user->sales_id <= 0)
    {
        fprintf(stderr, "验证错误: 用户 '%s' 的 sales_id 无效 (%d)。\n", username, user->sales_id);
        return 7; // sales_id 无效
    }

    // 使用 sales_manager.c 中的查找函数 (确保已实现 findSalesById)
    Sales *sales = findSalesById(salesList, user->sales_id);
    if (!sales)
    {
        fprintf(stderr, "验证错误: 未找到与用户 '%s' 关联的业务员记录 (Sales ID: %d)。\n", username, user->sales_id);
        return 3; // 业务员记录不存在
    }

    // --- 进行信息比对 ---
    // 姓名比较 (大小写不敏感比较可能更好，但这里用精确匹配)
    if (strcmp(sales->name, name) != 0)
    {
        fprintf(stderr, "验证失败: 姓名不匹配 (输入: %s, 记录: %s)\n", name, sales->name);
        return 4; // 姓名不匹配
    }

    // 生日比较
    if (sales->birth_year != birth_year || sales->birth_month != birth_month || sales->birth_day != birth_day)
    {
        fprintf(stderr, "验证失败: 生日不匹配 (输入: %d-%d-%d, 记录: %d-%d-%d)\n", birth_year, birth_month, birth_day, sales->birth_year, sales->birth_month, sales->birth_day);
        return 5; // 生日不匹配
    }

    // 邮箱比较 (大小写不敏感比较可能更好)
    // 简单的精确比较：
    if (strcmp(sales->email, email) != 0)
    {
        fprintf(stderr, "验证失败: 邮箱不匹配 (输入: %s, 记录: %s)\n", email, sales->email);
        return 6; // 邮箱不匹配
    }
    /* // 简单的忽略大小写比较示例：
     char email_lower[100];
     char sales_email_lower[100];
     scpy(email_lower, email, sizeof(email_lower));
     scpy(sales_email_lower, sales->email, sizeof(sales_email_lower));
     for(int i = 0; email_lower[i]; i++) email_lower[i] = tolower(email_lower[i]);
     for(int i = 0; sales_email_lower[i]; i++) sales_email_lower[i] = tolower(sales_email_lower[i]);
     if (strcmp(sales_email_lower, email_lower) != 0) {
         fprintf(stderr, "验证失败: 邮箱不匹配 (输入: %s, 记录: %s)\n", email, sales->email);
         return 6; // 邮箱不匹配
     }
    */

    // 所有检查通过
    printf("用户 '%s' 身份验证成功。\n", username);
    fflush(stdout);
    return 0; // 成功
}

int resetUserPassword(User *head, const char *username, const char *newPassword)
{
    if (!head || !username || !newPassword)
        return -1;
    if (strlen(newPassword) == 0)
    {
        fprintf(stderr, "错误: 新密码不能为空。\n");
        return -1; // Or a specific code for empty password
    }

    User *current = head;
    char newPasswordHash[65];

    while (current)
    {
        if (strcmp(current->username, username) == 0)
        {
            // 找到用户，直接设置新密码
            hashPassword(newPassword, newPasswordHash);
            scpy(current->password_hash, newPasswordHash, sizeof(current->password_hash));
            printf("用户 '%s' 的密码已成功重置。\n", username);
            fflush(stdout);
            return 0; // 成功
        }
        current = current->next;
    }

    fprintf(stderr, "错误: 未找到用户 '%s' 以重置密码。\n", username);
    return 1; // 用户不存在
}
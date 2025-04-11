#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../include/sales_manager.h"
#include "../include/file_manager.h"

Sales *parseSalesFromString(char *inputString, bool newID)
{
    if (!inputString || strlen(inputString) == 0)
    {
        return NULL;
    }
    Sales *newSales = (Sales *)malloc(sizeof(Sales));
    if (!newSales)
    {
        return NULL;
    }
    memset(newSales, 0, sizeof(Sales));
    char idStr[50] = {0};
    char birthYearStr[50] = {0};
    char birthMonthStr[50] = {0};
    char birthDayStr[50] = {0};
    char phonesStr[4096] = {0};
    char clientIDsStr[4096] = {0};
    int scanned = sscanf(inputString, "%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\x1C]\x1C%[^\n]",
                         idStr, newSales->name, newSales->gender, birthYearStr, birthMonthStr, birthDayStr, newSales->email, phonesStr, clientIDsStr);
    if (scanned < 7)
    {
        fprintf(stderr, "输入错误请重新输入\n");
        free(newSales);
        return NULL;
    }
    newSales->id = newID ? uidGenerate() : stoi(idStr);
    if (isGenderValid(newSales->gender) == -1)
    {
        fprintf(stderr, "性别输入错误，请重新输入\n");
        free(newSales);
        return NULL;
    }
    if (!isBirthDayValid(birthYearStr, birthMonthStr, birthDayStr))
    {
        fprintf(stderr, "出生日期输入错误\n");
        free(newSales);
        return NULL;
    }
    if (!isEmailValid(newSales->email))
    {
        fprintf(stderr, "邮箱格式错误，请重新输入 %s\n", newSales->email);
        free(newSales);
        return NULL;
    }
    newSales->birth_year = stoi(birthYearStr);
    newSales->birth_month = stoi(birthMonthStr);
    newSales->birth_day = stoi(birthDayStr);
    newSales->phone_count = 0;
    if (scanned >= 8 && strlen(phonesStr) > 0)
    {
        char *phone_token = strtok(phonesStr, "\x1D");
        while (phone_token && newSales->phone_count < 100)
        {
            if (!isPhoneNumberValid(phone_token))
            {
                fprintf(stderr, "手机号输入格式错误请重新输入");
                free(newSales);
                return NULL;
            }
            scpy(newSales->phones[newSales->phone_count], phone_token, sizeof(newSales->phones[0]));
            newSales->phone_count++;
            phone_token = strtok(NULL, "\x1D");
        }
    }
    newSales->client_count = 0;
    if (scanned >= 9 && strlen(clientIDsStr) > 0)
    {
        char *clientId_token = strtok(clientIDsStr, "\x1D");
        while (clientId_token && newSales->client_count < 100)
        {
            newSales->client_ids[newSales->client_count] = stoi(clientId_token);
            newSales->client_count++;
            clientId_token = strtok(NULL, "\x1D");
        }
    }
    newSales->next = NULL;
    return newSales;
}

Sales *addSales(Sales *head, Sales *newSale)
{
    if (newSale == NULL)
        return head;
    if (head)
    {
        Sales *current = head;
        while (current->next)
            current = current->next;
        current->next = newSale;
    }
    else
        head = newSale;
    printf("业务员 '%s' 添加成功！\n", newSale->name);
    return head;
}

Sales *deleteSales(Sales *head, int id)
{
    Sales *current = head;
    Sales *prev = NULL;
    while (current && current->id != id)
    {
        prev = current;
        current = current->next;
    }
    if (!current)
    {
        fprintf(stderr, "未找到要删除的业务员 ID: %d\n", id);
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
    printf("业务员 ID %d (%s) 已删除\n", current->id, current->name);
    free(current);
    return head;
}

Sales *modifySales(Sales *head, Sales *newSale)
{
    if (head == NULL)
        return newSale;
    Sales *current = head;
    Sales *prev = NULL;
    while (current)
    {
        if (current->id == newSale->id)
        {
            newSale->next = current->next;
            if (!prev)
            {
                head = newSale;
            }
            else
            {
                prev->next = newSale;
                newSale->next = current->next;
            }
            printf("业务员 ID %d (%s) 信息已更新\n", newSale->id, newSale->name);
            return head;
        }
        prev = current;
        current = current->next;
    }
    return head;
}

int cmpSales(Sales *a, Sales *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->name, b->name);
    case 3:
        return strcmp(a->gender, b->gender);
    case 4:
        if (a->birth_year != b->birth_year)
            return a->birth_year - b->birth_year;
        if (a->birth_month != b->birth_month)
            return a->birth_month - b->birth_month;
        return a->birth_day - b->birth_day;
    case 7:
        return strcmp(a->email, b->email);
    case 8:
        return a->client_count - b->client_count;
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->name, a->name);
    case -3:
        return strcmp(b->gender, a->gender);
    case -4:
        if (a->birth_year != b->birth_year)
            return b->birth_year - a->birth_year;
        if (a->birth_month != b->birth_month)
            return b->birth_month - a->birth_month;
        return b->birth_day - a->birth_day;
    case -7:
        return strcmp(b->email, a->email);
    case -8:
        return b->client_count - a->client_count;
    default:
        return 0;
    }
}

Sales *mergeSalesSortedLists(Sales *list1, Sales *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Sales *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmpSales(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeSalesSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmpSales(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeSalesSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeSalesSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitSalesList(Sales *head, Sales **front, Sales **back)
{
    Sales *slow = head;
    Sales *fast = head->next;
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

Sales *mergeSortSales(Sales *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Sales *front = NULL;
    Sales *back = NULL;
    splitSalesList(head, &front, &back);
    front = mergeSortSales(front, cnt, a);
    back = mergeSortSales(back, cnt, a);
    return mergeSalesSortedLists(front, back, cnt, a);
}

void displaySales(Sales *head, const char *pattern, int *sortKeys, int sortKeyCount, const char *searchName, const char *searchEmail, const char *searchClientCount)
{
    if (sortKeyCount > 0 && sortKeys)
    {
        head = mergeSortSales(head, sortKeyCount, sortKeys);
    }
    Sales *current = head;
    char text[15000];
    char tmp[200];
    char lowerFieldBuffer[1024];
    char numericStrBuffer[50];
    int match_count = 0;
    while (current)
    {
        bool should_display = true;
        if (should_display && searchName && strlen(searchName) > 0)
        {
            scpy(lowerFieldBuffer, current->name, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchName) < 0)
                should_display = false;
        }
        if (should_display && searchEmail && strlen(searchEmail) > 0)
        {
            scpy(lowerFieldBuffer, current->email, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchEmail) < 0)
                should_display = false;
        }
        if (should_display && searchClientCount && strlen(searchClientCount) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
            if (strncmp(searchClientCount, ">=", 2) == 0)
            {
                strcpy(op, ">=");
                offset = 2;
            }
            else if (strncmp(searchClientCount, "<=", 2) == 0)
            {
                strcpy(op, "<=");
                offset = 2;
            }
            else if (strncmp(searchClientCount, "==", 2) == 0)
            {
                strcpy(op, "==");
                offset = 2;
            }
            else if (strncmp(searchClientCount, ">", 1) == 0)
            {
                strcpy(op, ">");
                offset = 1;
            }
            else if (strncmp(searchClientCount, "<", 1) == 0)
            {
                strcpy(op, "<");
                offset = 1;
            }
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchClientCount + offset, "%d %c", &targetVal, &check_end) == 1)
                    useNumericCompare = true;
            }
            if (useNumericCompare)
            {
                bool match = false;
                if (strcmp(op, ">=") == 0)
                    match = (current->client_count >= targetVal);
                else if (strcmp(op, "<=") == 0)
                    match = (current->client_count <= targetVal);
                else if (strcmp(op, "==") == 0)
                    match = (current->client_count == targetVal);
                else if (strcmp(op, ">") == 0)
                    match = (current->client_count > targetVal);
                else if (strcmp(op, "<") == 0)
                    match = (current->client_count < targetVal);
                if (!match)
                    should_display = false;
            }
            else
            {
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->client_count);
                if (kmp(numericStrBuffer, searchClientCount) < 0)
                    should_display = false;
            }
        }
        if (should_display && pattern && strlen(pattern) > 0)
        {
            text[0] = '\0';
            snprintf(tmp, sizeof(tmp), "%d", current->id);
            strcat(text, tmp);
            strncat(text, current->name, sizeof(text) - strlen(text) - 1);
            strncat(text, current->gender, sizeof(text) - strlen(text) - 1);
            snprintf(tmp, sizeof(tmp), "%d", current->birth_year);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->birth_month);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->birth_day);
            strcat(text, tmp);
            strncat(text, current->email, sizeof(text) - strlen(text) - 1);
            for (int i = 0; i < current->phone_count; i++)
                strncat(text, current->phones[i], sizeof(text) - strlen(text) - 1);
            for (int i = 0; i < current->client_count; i++)
            {
                snprintf(tmp, sizeof(tmp), "%d", current->client_ids[i]);
                strncat(text, tmp, sizeof(text) - strlen(text) - 1);
            }
            toLower(text);
            if (kmp(text, pattern) < 0)
                should_display = false;
        }
        if (should_display)
        {
            match_count++;
            printf("%d\x1C%s\x1C%s\x1C%d\x1C%d\x1C%d\x1C%s\x1C", current->id, current->name, current->gender, current->birth_year, current->birth_month, current->birth_day, current->email);
            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : "\x1D");
            printf("\x1C");
            for (int i = 0; i < current->client_count; i++)
                printf("%d%s", current->client_ids[i], (i == current->client_count - 1) ? "" : "\x1D");
            printf("\n");
        }
        current = current->next;
    }
    printf("%d\n", match_count);
}

void displaySalesIdsAndNames(Sales *head)
{
    Sales *current = head;
    while (current)
    {
        printf("%d,%s", current->id, current->name);
        if (current->next)
            printf("\x1C");
        current = current->next;
    }
    printf("\n");
}

Sales *findSalesById(Sales *head, int id)
{
    Sales *current = head;
    while (current)
    {
        if (current->id == id)
            return current;
        current = current->next;
    }
    return NULL;
}

void displayUnlinkedSales(Sales *salesHead, User *userHead)
{
    Sales *currentSales = salesHead;
    bool first = true;
    while (currentSales)
    {
        bool linked = false;
        User *currentUser = userHead;
        while (currentUser)
        {
            if (strcmp(currentUser->role, "sales") == 0 && currentUser->sales_id == currentSales->id)
            {
                linked = true;
                break;
            }
            currentUser = currentUser->next;
        }
        if (!linked)
        {
            if (!first)
                printf("\x1C");
            printf("%d\x1D%s", currentSales->id, currentSales->name);
            first = false;
        }
        currentSales = currentSales->next;
    }
    printf("\n");
}

void freeSalesList(Sales *head)
{
    Sales *current = head;
    Sales *next_node;
    while (current)
    {
        next_node = current->next;
        free(current);
        current = next_node;
    }
}
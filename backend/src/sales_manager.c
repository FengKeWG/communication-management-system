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
    char phonesStr[4096] = {0};
    char clientIDsStr[4096] = {0};
    int scanned = sscanf(inputString, "%[^;];%[^;];%d;%d;%d;%d;%[^;];%[^;];%[^\n]", idStr, newSales->name, &newSales->gender, &newSales->birth_year, &newSales->birth_month, &newSales->birth_day, newSales->email, phonesStr, clientIDsStr);
    if (scanned < 7)
    {
        free(newSales);
        return NULL;
    }
    newSales->id = newID ? uidGenerate() : stoi(idStr);
    newSales->phone_count = 0;
    if (scanned >= 8 && strlen(phonesStr) > 0)
    {
        char *phone_token = strtok(phonesStr, ",");
        while (phone_token && newSales->phone_count < 100)
        {
            scpy(newSales->phones[newSales->phone_count], phone_token, sizeof(newSales->phones[0]));
            newSales->phone_count++;
            phone_token = strtok(NULL, ",");
        }
    }
    newSales->client_count = 0;
    if (scanned >= 9 && strlen(clientIDsStr) > 0)
    {
        char *clientId_token = strtok(clientIDsStr, ",");
        while (clientId_token && newSales->client_count < 100)
        {
            if (strlen(clientId_token) > 0)
            {
                newSales->client_ids[newSales->client_count] = stoi(clientId_token);
                newSales->client_count++;
            }
            clientId_token = strtok(NULL, ",");
        }
    }
    newSales->next = NULL;
    return newSales;
}

Sales *addSales(Sales *head, Sales *newSale)
{
    if (newSale == NULL)
        return head;
    if (head != NULL)
    {
        Sales *current = head;
        while (current->next != NULL)
            current = current->next;
        current->next = newSale;
    }
    else
        head = newSale;
    return head;
}

Sales *deleteSales(Sales *head, int id)
{
    Sales *p1, *p2;
    p1 = head;
    if (p1->id == id)
    {
        head = p1->next;
        free(p1);
    }
    return head;
    while (p1 != NULL)
    {
        p2 = p1;
        p1 = p1->next;
        if (p1->id == id)
        {
            p2->next = p1->next;
            free(p1);
            break;
        }
    }
    return head;
}

Sales *modifySales(Sales *head, Sales *newSale)
{
    if (head == NULL)
        return newSale;

    Sales *current = head;
    Sales *prev = NULL;

    while (current != NULL)
    {
        if (current->id == newSale->id)
        {
            if (current == head)
            {
                newSale->next = current->next;
                free(current);
                return newSale;
            }
            else
            {
                prev->next = newSale;
                newSale->next = current->next;
                free(current);
                return head;
            }
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
        return a->birth_year - b->birth_year;
    case 4:
        return a->birth_month - b->birth_month;
    case 5:
        return a->birth_day - b->birth_day;
    case 6:
        return strcmp(a->email, b->email);
    case 7:
        return a->client_count - b->client_count;
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->name, a->name);
    case -3:
        return b->birth_year - a->birth_year;
    case -4:
        return b->birth_month - a->birth_month;
    case -5:
        return b->birth_day - a->birth_day;
    case -6:
        return strcmp(b->email, a->email);
    case -7:
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

void displaySales(Sales *head, const char *pattern, int *sortKeys, int sortKeyCount)
{
    if (sortKeyCount > 0 && sortKeys != NULL)
    {
        head = mergeSortSales(head, sortKeyCount, sortKeys);
    }
    Sales *current = head;
    char text[15000];
    char tmp[200];
    while (current)
    {
        text[0] = '\0';
        snprintf(tmp, sizeof(tmp), "%d", current->id);
        strcat(text, tmp);
        strncat(text, current->name, sizeof(text) - strlen(text) - 1);
        snprintf(tmp, sizeof(tmp), "%d", current->gender);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->birth_year);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->birth_month);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->birth_day);
        strcat(text, tmp);
        strncat(text, current->email, sizeof(text) - strlen(text) - 1);
        for (int i = 0; i < current->phone_count; i++)
        {
            strncat(text, current->phones[i], sizeof(text) - strlen(text) - 1);
        }
        for (int i = 0; i < current->client_count; i++)
        {
            snprintf(tmp, sizeof(tmp), "%d", current->client_ids[i]);
            strncat(text, tmp, sizeof(text) - strlen(text) - 1);
        }
        toLower(text);
        if (strlen(pattern) == 0 || kmp(text, pattern) >= 0)
        {
            printf("%d;%s;%d;%d;%d;%d;%s;",
                   current->id, current->name, current->gender,
                   current->birth_year, current->birth_month, current->birth_day,
                   current->email);
            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : ",");
            printf(";");
            for (int i = 0; i < current->client_count; i++)
                printf("%d%s", current->client_ids[i], (i == current->client_count - 1) ? "" : ",");
            printf("\n");
        }
        current = current->next;
    }
}

void displaySalesIdsAndNames(Sales *head)
{
    Sales *current = head;
    while (current != NULL)
    {
        printf("%d,%s", current->id, current->name);
        if (current->next)
            printf(";");
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
        {
            return current;
        }
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
            // 检查是否有用户的 sales_id 与当前业务员的 id 匹配
            if (strcmp(currentUser->role, "sales") == 0 && currentUser->sales_id == currentSales->id)
            {
                linked = true;
                break;
            }
            currentUser = currentUser->next;
        }

        // 如果没有找到链接的用户，则输出该业务员
        if (!linked)
        {
            if (!first)
            {
                printf(";"); // 分隔符
            }
            printf("%d,%s", currentSales->id, currentSales->name); // 输出格式 "id,name"
            first = false;
        }
        currentSales = currentSales->next;
    }
    printf("\n"); // 结尾换行
}
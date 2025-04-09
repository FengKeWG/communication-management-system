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

    int scanned = sscanf(inputString, "%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^\n]",
                         idStr, newSales->name, newSales->gender, birthYearStr, birthMonthStr, birthDayStr, newSales->email, phonesStr, clientIDsStr);

    if (scanned < 7) // 至少需要扫描出7个字段
    {
        fprintf(stderr, "Error: Input string format is incorrect.\n");
        free(newSales);
        return NULL;
    }

    // 验证 idStr
    if (/* 验证 idStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid sales ID format: '%s'\n", idStr);
        free(newSales);
        return NULL;
    }
    newSales->id = newID ? uidGenerate() : stoi(idStr);

    // 验证 gender
    if (/* 验证 newSales->gender 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid gender format: '%s'\n", newSales->gender);
        free(newSales);
        return NULL;
    }

    // 验证 birthYearStr
    if (/* 验证 birthYearStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid birth year format: '%s'\n", birthYearStr);
        free(newSales);
        return NULL;
    }
    newSales->birth_year = stoi(birthYearStr);

    // 验证 birthMonthStr
    if (/* 验证 birthMonthStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid birth month format: '%s'\n", birthMonthStr);
        free(newSales);
        return NULL;
    }
    newSales->birth_month = stoi(birthMonthStr);

    // 验证 birthDayStr
    if (/* 验证 birthDayStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid birth day format: '%s'\n", birthDayStr);
        free(newSales);
        return NULL;
    }
    newSales->birth_day = stoi(birthDayStr);

    newSales->phone_count = 0;
    if (scanned >= 8 && strlen(phonesStr) > 0)
    {
        char *phone_token = strtok(phonesStr, ",");
        while (phone_token && newSales->phone_count < 100)
        {
            if (/* 验证 phone_token 是否合法 */)
            {
                fprintf(stderr, "Error: Invalid phone format: '%s'\n", phone_token);
                free(newSales);
                return NULL;
            }

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
            if (/* 验证 clientId_token 是否合法 */)
            {
                fprintf(stderr, "Error: Invalid client ID format: '%s'\n", clientId_token);
                free(newSales);
                return NULL;
            }

            newSales->client_ids[newSales->client_count] = stoi(clientId_token);
            newSales->client_count++;
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
        return strcmp(a->gender, b->gender);
    case 4:
        return a->birth_year - b->birth_year;
    case 5:
        return a->birth_month - b->birth_month;
    case 6:
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
        return b->birth_year - a->birth_year;
    case -5:
        return b->birth_month - a->birth_month;
    case -6:
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
    if (sortKeyCount > 0 && sortKeys != NULL)
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
            printf("%d;%s;%s;%d;%d;%d;%s;",
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
    printf("%d\n", match_count);
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
                printf(";");
            printf("%d,%s", currentSales->id, currentSales->name);
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
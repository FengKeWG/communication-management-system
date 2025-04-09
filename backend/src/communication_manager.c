#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../include/utils.h"
#include "../include/communication_manager.h"

Communication *parseCommunicationFromString(char *inputString, bool newID)
{
    if (!inputString || strlen(inputString) == 0)
    {
        return NULL;
    }

    Communication *newComm = (Communication *)malloc(sizeof(Communication));
    if (!newComm)
    {
        return NULL;
    }
    memset(newComm, 0, sizeof(Communication));

    char idStr[50] = {0};
    char clientIdStr[50] = {0};
    char contactIdStr[50] = {0};
    char salesIdStr[50] = {0};
    char yearStr[50] = {0};
    char monthStr[50] = {0};
    char dayStr[50] = {0};
    char hourStr[50] = {0};
    char minuteStr[50] = {0};
    char secondStr[50] = {0};
    char durationStr[50] = {0};

    int scanned = sscanf(inputString, "%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^\n]",
                         idStr, clientIdStr, contactIdStr, salesIdStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr, durationStr, newComm->content);

    if (scanned < 12)
    {
        fprintf(stderr, "Error: Input string format is incorrect.\n");
        free(newComm);
        return NULL;
    }

    // 验证 idStr
    if (/* 验证 idStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid communication ID format: '%s'\n", idStr);
        free(newComm);
        return NULL;
    }
    newComm->id = newID ? uidGenerate() : stoi(idStr);

    // 验证 clientIdStr
    if (/* 验证 clientIdStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid client ID format: '%s'\n", clientIdStr);
        free(newComm);
        return NULL;
    }
    newComm->client_id = stoi(clientIdStr);

    // 验证 contactIdStr
    if (/* 验证 contactIdStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid contact ID format: '%s'\n", contactIdStr);
        free(newComm);
        return NULL;
    }
    newComm->contact_id = stoi(contactIdStr);

    // 验证 salesIdStr
    if (/* 验证 salesIdStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid sales ID format: '%s'\n", salesIdStr);
        free(newComm);
        return NULL;
    }
    newComm->sales_id = stoi(salesIdStr);

    // 验证 yearStr
    if (/* 验证 yearStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid year format: '%s'\n", yearStr);
        free(newComm);
        return NULL;
    }
    newComm->year = stoi(yearStr);

    // 验证 monthStr
    if (/* 验证 monthStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid month format: '%s'\n", monthStr);
        free(newComm);
        return NULL;
    }
    newComm->month = stoi(monthStr);

    // 验证 dayStr
    if (/* 验证 dayStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid day format: '%s'\n", dayStr);
        free(newComm);
        return NULL;
    }
    newComm->day = stoi(dayStr);

    // 验证 hourStr
    if (/* 验证 hourStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid hour format: '%s'\n", hourStr);
        free(newComm);
        return NULL;
    }
    newComm->hour = stoi(hourStr);

    // 验证 minuteStr
    if (/* 验证 minuteStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid minute format: '%s'\n", minuteStr);
        free(newComm);
        return NULL;
    }
    newComm->minute = stoi(minuteStr);

    // 验证 secondStr
    if (/* 验证 secondStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid second format: '%s'\n", secondStr);
        free(newComm);
        return NULL;
    }
    newComm->second = stoi(secondStr);

    // 验证 durationStr
    if (/* 验证 durationStr 是否合法 */)
    {
        fprintf(stderr, "Error: Invalid duration format: '%s'\n", durationStr);
        free(newComm);
        return NULL;
    }
    newComm->duration = stoi(durationStr);

    newComm->next = NULL;
    return newComm;
}

Communication *addCommunication(Communication *head, Communication *newCommunication)
{
    if (newCommunication == NULL)
        return head;
    if (head != NULL)
    {
        Communication *current = head;
        while (current->next != NULL)
            current = current->next;
        current->next = newCommunication;
    }
    else
        head = newCommunication;
    return head;
}

Communication *modifyCommunication(Communication *head, Communication *newCommunication)
{
    if (head == NULL)
        return newCommunication;
    Communication *current = head;
    Communication *prev = NULL;
    while (current != NULL)
    {
        if (current->id == newCommunication->id)
        {
            if (current == head)
            {
                newCommunication->next = current->next;
                free(current);
                return newCommunication;
            }
            else
            {
                prev->next = newCommunication;
                newCommunication->next = current->next;
                free(current);
                return head;
            }
        }
        prev = current;
        current = current->next;
    }
    return head;
}

int cmpCommunication(Communication *a, Communication *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return a->client_id - b->client_id;
    case 3:
        return a->contact_id - b->contact_id;
    case 4:
        return a->sales_id - b->sales_id;
    case 5:
        return a->year - b->year;
    case 6:
        return a->month - b->month;
    case 7:
        return a->day - b->day;
    case 8:
        return a->hour - b->hour;
    case 9:
        return a->minute - b->minute;
    case 10:
        return a->second - b->second;
    case 11:
        return a->duration - b->duration;
    case -1:
        return a->id - b->id;
    case -2:
        return b->client_id - a->client_id;
    case -3:
        return b->contact_id - a->contact_id;
    case -4:
        return b->sales_id - a->sales_id;
    case -5:
        return b->year - a->year;
    case -6:
        return b->month - a->month;
    case -7:
        return b->day - a->day;
    case -8:
        return b->hour - a->hour;
    case -9:
        return b->minute - a->minute;
    case -10:
        return b->second - a->second;
    case -11:
        return b->duration - a->duration;
    default:
        return 0;
    }
}

Communication *mergeCommunicationSortedLists(Communication *list1, Communication *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Communication *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmpCommunication(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeCommunicationSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmpCommunication(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeCommunicationSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeCommunicationSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitCommunicationList(Communication *head, Communication **front, Communication **back)
{
    Communication *slow = head;
    Communication *fast = head->next;
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

Communication *mergeSortCommunication(Communication *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Communication *front = NULL;
    Communication *back = NULL;
    splitCommunicationList(head, &front, &back);
    front = mergeSortCommunication(front, cnt, a);
    back = mergeSortCommunication(back, cnt, a);
    return mergeCommunicationSortedLists(front, back, cnt, a);
}

void displayCommunication(Communication *head, const char *pattern, int *sortKeys, int sortKeyCount, int filter_sales_id, const char *searchClientId, const char *searchContactId, const char *searchSalesId, const char *searchDuration, const char *searchContent)
{
    if (sortKeyCount > 0 && sortKeys != NULL)
    {
        head = mergeSortCommunication(head, sortKeyCount, sortKeys);
    }
    Communication *current = head;
    char text[15000]; // For general KMP
    char tmp[200];
    char lowerFieldBuffer[1024]; // For specific text field KMP
    char numericStrBuffer[50];   // For number field KMP/conversion

    int match_count = 0; // 初始化计数器

    while (current)
    {
        bool should_display = true;

        // ---- 业务员过滤 ----
        if (filter_sales_id > 0 && current->sales_id != filter_sales_id)
        {
            should_display = false;
        }

        // ---- 特定字段搜索 ----
        // Check Client ID (Exact Match String)
        if (should_display && searchClientId && strlen(searchClientId) > 0)
        {
            snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->client_id);
            // 使用 strcmp 进行精确匹配
            if (strcmp(numericStrBuffer, searchClientId) != 0)
            {
                should_display = false;
            }
            // 如果需要包含搜索，用 KMP:
            // if (kmp(numericStrBuffer, searchClientId) < 0) { should_display = false; }
        }
        // Check Contact ID (Exact Match String)
        if (should_display && searchContactId && strlen(searchContactId) > 0)
        {
            snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->contact_id);
            if (strcmp(numericStrBuffer, searchContactId) != 0)
            {
                should_display = false;
            }
            // if (kmp(numericStrBuffer, searchContactId) < 0) { should_display = false; }
        }
        // Check Sales ID (Exact Match String)
        if (should_display && searchSalesId && strlen(searchSalesId) > 0)
        {
            snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->sales_id);
            if (strcmp(numericStrBuffer, searchSalesId) != 0)
            {
                should_display = false;
            }
            // if (kmp(numericStrBuffer, searchSalesId) < 0) { should_display = false; }
        }
        // Check Content (Contains)
        if (should_display && searchContent && strlen(searchContent) > 0)
        {
            scpy(lowerFieldBuffer, current->content, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchContent) < 0)
            {
                should_display = false;
            }
        }
        // Check Duration (Range or Contains)
        if (should_display && searchDuration && strlen(searchDuration) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
            if (strncmp(searchDuration, ">=", 2) == 0)
            {
                strcpy(op, ">=");
                offset = 2;
            }
            else if (strncmp(searchDuration, "<=", 2) == 0)
            {
                strcpy(op, "<=");
                offset = 2;
            }
            else if (strncmp(searchDuration, "==", 2) == 0)
            {
                strcpy(op, "==");
                offset = 2;
            }
            else if (strncmp(searchDuration, ">", 1) == 0)
            {
                strcpy(op, ">");
                offset = 1;
            }
            else if (strncmp(searchDuration, "<", 1) == 0)
            {
                strcpy(op, "<");
                offset = 1;
            }
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchDuration + offset, "%d %c", &targetVal, &check_end) == 1)
                {
                    useNumericCompare = true;
                }
            }
            if (useNumericCompare)
            {
                bool match = false;
                if (strcmp(op, ">=") == 0)
                    match = (current->duration >= targetVal);
                else if (strcmp(op, "<=") == 0)
                    match = (current->duration <= targetVal);
                else if (strcmp(op, "==") == 0)
                    match = (current->duration == targetVal);
                else if (strcmp(op, ">") == 0)
                    match = (current->duration > targetVal);
                else if (strcmp(op, "<") == 0)
                    match = (current->duration < targetVal);
                if (!match)
                    should_display = false;
            }
            else
            {
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->duration);
                if (kmp(numericStrBuffer, searchDuration) < 0)
                {
                    should_display = false;
                }
            }
        }

        // ---- 通用搜索 ----
        if (should_display && pattern && strlen(pattern) > 0)
        {
            text[0] = '\0';
            snprintf(tmp, sizeof(tmp), "%d", current->id);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->client_id);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->contact_id);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->sales_id);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->year);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->month);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->day);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->hour);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->minute);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->second);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->duration);
            strcat(text, tmp);
            strncat(text, current->content, sizeof(text) - strlen(text) - 1);
            toLower(text);
            if (kmp(text, pattern) < 0)
            {
                should_display = false;
            }
        }

        if (should_display)
        {
            match_count++; // 增加计数
            // 打印行数据
            printf("%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%s\n",
                   current->id, current->client_id, current->contact_id, current->sales_id,
                   current->year, current->month, current->day,
                   current->hour, current->minute, current->second,
                   current->duration, current->content);
        }
        current = current->next;
    }
    printf("%d\n", match_count); // 打印总数
}
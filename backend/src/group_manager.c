#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../include/group_manager.h"
#include "../include/client_manager.h"
#include "../include/utils.h"

Group *parseGroupFromString(char *inputString, bool newID)
{
    if (!inputString || strlen(inputString) == 0)
    {
        fprintf(stderr, "请输入分组信息\n");
        return NULL;
    }
    Group *newGroup = (Group *)malloc(sizeof(Group));
    if (!newGroup)
    {
        return NULL;
    }
    memset(newGroup, 0, sizeof(Group));
    char idStr[50] = {0};
    char clientIDsStr[10000] = {0};
    int scanned = sscanf(inputString, "%[^\x1C]\x1C%[^\x1C]\x1C%[^\n]", idStr, newGroup->name, clientIDsStr);
    if (scanned < 2)
    {
        fprintf(stderr, "输入格式错误请重新输入\n");
        free(newGroup);
        return NULL;
    }
    newGroup->id = newID ? uidGenerate() : stoi(idStr);
    newGroup->client_count = 0;
    if (strlen(clientIDsStr) > 0)
    {
        char *clientIdToken = strtok(clientIDsStr, "\x1D");
        while (clientIdToken && newGroup->client_count < 100)
        {
            int clientId = stoi(clientIdToken);
            newGroup->client_ids[newGroup->client_count] = clientId;
            newGroup->client_count++;
            clientIdToken = strtok(NULL, "\x1D");
        }
    }
    newGroup->next = NULL;
    return newGroup;
}

Group *addGroup(Group *head, Group *newGroup)
{
    if (!newGroup)
        return head;
    if (!head)
        return newGroup;
    Group *current = head;
    while (current->next)
    {
        current = current->next;
    }
    current->next = newGroup;
    printf("分组 '%s' 添加成功！\n", newGroup->name);
    return head;
}

Group *deleteGroup(Group *head, int id)
{
    Group *current = head;
    Group *prev = NULL;
    while (current && current->id != id)
    {
        prev = current;
        current = current->next;
    }
    if (!current)
    {
        fprintf(stderr, "未找到要删除的分组 ID: %d\n", id);
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
    printf("分组 ID %d (%s) 已删除\n", current->id, current->name);
    free(current);
    return head;
}

Group *modifyGroup(Group *head, Group *newGroup)
{
    if (!head || !newGroup)
        return head;
    Group *current = head;
    Group *prev = NULL;
    while (current)
    {
        if (current->id == newGroup->id)
        {
            newGroup->next = current->next;
            if (!prev)
            {
                head = newGroup;
            }
            else
            {
                prev->next = newGroup;
                newGroup->next = current->next;
            }
            printf("分组 ID %d (%s) 信息已更新\n", newGroup->id, newGroup->name);
            return head;
        }
        prev = current;
        current = current->next;
    }
    fprintf(stderr, "未找到要修改的分组 ID: %d\n", newGroup->id);
    free(newGroup);
    return head;
}

Group *findGroupById(Group *head, int id)
{
    Group *current = head;
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

int cmpGroup(Group *a, Group *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->name, b->name);
    case 3:
        return a->client_count - b->client_count;
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->name, a->name);
    case -3:
        return b->client_count - a->client_count;
    default:
        return 0;
    }
}

Group *mergeGroupSortedLists(Group *list1, Group *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Group *sortedList = NULL;
    bool decided = false;
    for (int i = 0; i < cnt && !decided; i++)
    {
        int cmp_res = cmpGroup(list1, list2, a[i]);
        if (cmp_res < 0)
        {
            sortedList = list1;
            sortedList->next = mergeGroupSortedLists(list1->next, list2, cnt, a);
            decided = true;
        }
        else if (cmp_res > 0)
        {
            sortedList = list2;
            sortedList->next = mergeGroupSortedLists(list1, list2->next, cnt, a);
            decided = true;
        }
    }

    if (!decided)
    {
        sortedList = list1;
        sortedList->next = mergeGroupSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitGroupList(Group *head, Group **front, Group **back)
{
    if (!head || !head->next)
    {
        *front = head;
        *back = NULL;
        return;
    }
    Group *slow = head;
    Group *fast = head->next;
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

Group *mergeSortGroup(Group *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Group *front = NULL;
    Group *back = NULL;
    splitGroupList(head, &front, &back);
    front = mergeSortGroup(front, cnt, a);
    back = mergeSortGroup(back, cnt, a);
    return mergeGroupSortedLists(front, back, cnt, a);
}

void displayGroups(Group *head, const char *pattern, int *sortKeys, int sortKeyCount, const char *searchName, const char *searchClientCount)
{
    if (sortKeyCount > 0 && sortKeys)
    {
        head = mergeSortGroup(head, sortKeyCount, sortKeys);
    }
    Group *current = head;
    char searchableText[1024];
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
            {
                should_display = false;
            }
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
                {
                    useNumericCompare = true;
                }
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
                {
                    should_display = false;
                }
            }
        }

        if (should_display && pattern && strlen(pattern) > 0)
        {
            searchableText[0] = '\0';
            snprintf(searchableText, sizeof(searchableText), "%d %s", current->id, current->name);
            toLower(searchableText);
            if (kmp(searchableText, pattern) < 0)
            {
                should_display = false;
            }
        }

        if (should_display)
        {
            match_count++;
            printf("%d\x1C%s\x1C%d\x1C", current->id, current->name, current->client_count);
            for (int i = 0; i < current->client_count; i++)
            {
                printf("%d", current->client_ids[i]);
                if (i < current->client_count - 1)
                    printf("\x1D");
            }
            printf("\n");
        }
        current = current->next;
    }
    printf("%d\n", match_count);
}

void freeGroupList(Group *head)
{
    Group *current = head;
    Group *next_node;
    while (current)
    {
        next_node = current->next;
        free(current);
        current = next_node;
    }
}
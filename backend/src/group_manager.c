#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../include/group_manager.h"
#include "../include/client_manager.h"
#include "../include/utils.h"

// 解析分组字符串 "id;name;client_id1,client_id2,..."
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
    memset(newGroup, 0, sizeof(Group)); // 初始化

    char idStr[50] = {0};
    char clientIDsStr[10000] = {0}; // 用于存储用逗号分隔的 Client IDs

    // 使用 sscanf 解析输入字符串
    int scanned = sscanf(inputString, "%[^;];%[^;];%[^\n]", idStr, newGroup->name, clientIDsStr);

    if (scanned < 2) // 至少需要 ID 和 Name 两个字段
    {
        fprintf(stderr, "输入格式错误请重新输入\n");
        free(newGroup);
        return NULL;
    }

    // 验证 idStr
    newGroup->id = newID ? uidGenerate() : stoi(idStr);

    // 验证 group name
    if (isStrValid(newGroup->name))
    {
        fprintf(stderr, "输入格式错误请重新输入\n");
        free(newGroup);
        return NULL;
    }

    // 解析 Client IDs
    newGroup->client_count = 0;
    if (strlen(clientIDsStr) > 0)
    {
        char *clientIdToken = strtok(clientIDsStr, ",");
        while (clientIdToken && newGroup->client_count < 100)
        {
            int clientId = stoi(clientIdToken);
            newGroup->client_ids[newGroup->client_count] = clientId;
            newGroup->client_count++;
            clientIdToken = strtok(NULL, ",");
        }
    }

    newGroup->next = NULL;
    return newGroup;
}

// 添加分组到链表尾部
Group *addGroup(Group *head, Group *newGroup)
{
    if (!newGroup)
        return head;
    if (!head)
    {
        printf("分组 '%s' 添加成功！\n", newGroup->name);
        return newGroup;
    }
    Group *current = head;
    while (current->next)
    {
        current = current->next;
    }
    current->next = newGroup;
    printf("分组 '%s' 添加成功！\n", newGroup->name);
    return head;
}

// 根据 ID 删除分组
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
    { // 未找到
        fprintf(stderr, "未找到要删除的分组 ID: %d\n", id);
        return head;
    }

    if (!prev)
    { // 删除的是头节点
        head = current->next;
    }
    else
    {
        prev->next = current->next;
    }
    printf("分组 ID %d (%s) 已删除。\n", current->id, current->name);
    free(current);
    return head;
}

// 修改分组信息（替换旧节点）
Group *modifyGroup(Group *head, Group *updatedGroup)
{
    if (!head || !updatedGroup)
        return head;

    Group *current = head;
    Group *prev = NULL;

    while (current != NULL)
    {
        if (current->id == updatedGroup->id)
        {
            updatedGroup->next = current->next; // 链接后续节点
            if (prev == NULL)
            { // 更新的是头节点
                head = updatedGroup;
            }
            else
            {
                prev->next = updatedGroup; // 前一个节点指向新节点
            }
            printf("分组 ID %d (%s) 信息已更新。\n", updatedGroup->id, updatedGroup->name);
            free(current); // 释放旧节点内存
            return head;
        }
        prev = current;
        current = current->next;
    }

    // 如果循环结束还没找到
    fprintf(stderr, "未找到要修改的分组 ID: %d\n", updatedGroup->id);
    free(updatedGroup); // 释放未使用的 updatedGroup 内存
    return head;
}

// 根据 ID 查找分组
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

// --- 排序函数 (如果需要) ---
int cmpGroup(Group *a, Group *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->name, b->name);
    case 3:
        return a->client_count - b->client_count; // 按客户数量排序
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

// 归并排序相关函数 (mergeGroupSortedLists, splitGroupList, mergeSortGroup) - 与其他模块类似
// ... (此处省略，可以从 client_manager.c 或 sales_manager.c 复制并修改类型为 Group) ...
// 示例:
Group *mergeGroupSortedLists(Group *list1, Group *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Group *sortedList = NULL;
    bool decided = false; // 标志是否已决定当前节点
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
        // 如果 cmp_res == 0，则继续比较下一个排序键
    }
    // 如果所有排序键都相等，或者没有排序键，默认 list1 在前
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
    while (fast != NULL)
    {
        fast = fast->next;
        if (fast != NULL)
        {
            slow = slow->next;
            fast = fast->next;
        }
    }
    *front = head;
    *back = slow->next;
    slow->next = NULL; // 断开链表
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

// 显示分组列表
void displayGroups(Group *head, const char *pattern, int *sortKeys, int sortKeyCount, const char *searchName, const char *searchClientCount)
{
    if (sortKeyCount > 0 && sortKeys != NULL)
    {
        head = mergeSortGroup(head, sortKeyCount, sortKeys);
    }
    Group *current = head;
    char searchableText[1024];   // For general KMP
    char lowerFieldBuffer[1024]; // For name KMP
    char numericStrBuffer[50];   // For client count KMP/conversion

    int match_count = 0; // 初始化计数器

    while (current)
    {
        bool should_display = true;

        // ---- 特定字段搜索 ----
        // Check Name (Contains)
        if (should_display && searchName && strlen(searchName) > 0)
        {
            scpy(lowerFieldBuffer, current->name, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchName) < 0)
            {
                should_display = false;
            }
        }
        // Check Client Count (Range or Contains)
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

        // ---- 通用搜索 (ID 或 Name) ----
        if (should_display && pattern && strlen(pattern) > 0)
        {
            searchableText[0] = '\0';
            snprintf(searchableText, sizeof(searchableText), "%d %s", current->id, current->name);
            toLower(searchableText);
            if (kmp(searchableText, pattern) < 0)
            { // 使用 pattern (通用搜索词)
                should_display = false;
            }
        }

        if (should_display)
        {
            match_count++; // 增加计数
            // 输出格式: id;name;client_count;client_id1,client_id2,...
            printf("%d;%s;%d;", current->id, current->name, current->client_count);
            for (int i = 0; i < current->client_count; i++)
            {
                printf("%d", current->client_ids[i]);
                if (i < current->client_count - 1)
                    printf(",");
            }
            printf("\n");
        }
        current = current->next;
    }
    printf("%d\n", match_count); // 打印总数
}
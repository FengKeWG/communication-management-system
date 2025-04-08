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
        return NULL;

    Group *newGroup = (Group *)malloc(sizeof(Group));
    if (!newGroup)
        return NULL;
    memset(newGroup, 0, sizeof(Group)); // 初始化

    char idStr[50] = {0};
    char clientIDsStr[10000] = {0}; // 足够容纳 ID 和逗号

    // 格式: id;name;client_ids_comma_separated
    // 注意：sscanf 对于最后一个可能为空的字段处理需要小心
    char *token;
    char *rest = inputString;
    int field = 0;

    // 1. ID
    token = strtok_r(rest, ";", &rest);
    if (!token)
    {
        free(newGroup);
        return NULL;
    }
    scpy(idStr, token, sizeof(idStr));
    field++;

    // 2. Name
    token = strtok_r(rest, ";", &rest);
    if (!token)
    {
        free(newGroup);
        return NULL;
    }
    scpy(newGroup->name, token, sizeof(newGroup->name));
    field++;

    // 3. Client IDs (optional)
    token = strtok_r(rest, ";", &rest); // rest 现在是 client IDs 或 NULL
    if (token && strlen(token) > 0)
    {
        scpy(clientIDsStr, token, sizeof(clientIDsStr));
    }
    else
    {
        clientIDsStr[0] = '\0'; // 确保为空字符串
    }
    // field++; // 不再需要严格计数

    newGroup->id = newID ? uidGenerate() : stoi(idStr);

    // 解析 Client IDs
    newGroup->client_count = 0;
    if (strlen(clientIDsStr) > 0)
    {
        char *clientIdToken = strtok(clientIDsStr, ",");
        while (clientIdToken && newGroup->client_count < 100)
        {
            if (strlen(clientIdToken) > 0)
            { // 避免空 token
                newGroup->client_ids[newGroup->client_count] = stoi(clientIdToken);
                if (newGroup->client_ids[newGroup->client_count] > 0)
                { // 确保 ID 有效
                    newGroup->client_count++;
                }
                else
                {
                    fprintf(stderr, "警告: 解析分组 %d 时遇到无效的客户 ID '%s'\n", newGroup->id, clientIdToken);
                }
            }
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
        fflush(stdout);
        return newGroup;
    }
    Group *current = head;
    while (current->next)
    {
        current = current->next;
    }
    current->next = newGroup;
    printf("分组 '%s' 添加成功！\n", newGroup->name);
    fflush(stdout);
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
        fprintf(stderr, "错误: 未找到要删除的分组 ID: %d\n", id);
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
    fflush(stdout);
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
            fflush(stdout);
            free(current); // 释放旧节点内存
            return head;
        }
        prev = current;
        current = current->next;
    }

    // 如果循环结束还没找到
    fprintf(stderr, "错误: 未找到要修改的分组 ID: %d\n", updatedGroup->id);
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
void displayGroups(Group *head, const char *pattern, int *sortKeys, int sortKeyCount)
{
    if (sortKeyCount > 0 && sortKeys != NULL)
    {
        head = mergeSortGroup(head, sortKeyCount, sortKeys);
    }

    Group *current = head;
    char lowerPattern[1000] = {0};
    if (pattern)
    {
        scpy(lowerPattern, pattern, sizeof(lowerPattern));
        toLower(lowerPattern); // 转换搜索模式为小写
    }

    while (current)
    {
        // 构建用于搜索的文本（将 ID 和 Name 合并并转为小写）
        char searchableText[120] = {0};
        snprintf(searchableText, sizeof(searchableText), "%d %s", current->id, current->name);
        toLower(searchableText);

        // 检查是否匹配搜索模式
        if (strlen(lowerPattern) == 0 || kmp(searchableText, lowerPattern) >= 0)
        {
            // 输出格式: id;name;client_count;client_id1,client_id2,...
            printf("%d;%s;%d;", current->id, current->name, current->client_count);
            for (int i = 0; i < current->client_count; i++)
            {
                printf("%d", current->client_ids[i]);
                if (i < current->client_count - 1)
                {
                    printf(",");
                }
            }
            printf("\n");
        }
        current = current->next;
    }
    fflush(stdout);
}
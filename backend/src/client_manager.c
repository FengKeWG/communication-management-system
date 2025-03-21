#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "../include/client_manager.h"
#include "utils.h"

Client *parseClientFromArgs(int argc, char *argv[], bool newID)
{
    if (argc < 10)
    {
        return NULL;
    }
    Client *newClient = (Client *)malloc(sizeof(Client));
    if (!newClient)
    {
        return NULL;
    }
    memset(newClient, 0, sizeof(Client));

    if (newID)
        newClient->id = uidGenerate();
    else
        newClient->id = atoi(argv[2]); // 客户端ID

    strncpy(newClient->name, argv[3], sizeof(newClient->name) - 1);
    strncpy(newClient->region, argv[4], sizeof(newClient->region) - 1);
    strncpy(newClient->address, argv[5], sizeof(newClient->address) - 1);
    strncpy(newClient->legal_person, argv[6], sizeof(newClient->legal_person) - 1);

    // 更安全的 atoi 使用，处理可能的空字符串
    newClient->size = (argv[7] && argv[7][0] != '\0') ? atoi(argv[7]) : 0;
    newClient->contact_level = (argv[8] && argv[8][0] != '\0') ? atoi(argv[8]) : 0;

    strncpy(newClient->email, argv[9], sizeof(newClient->email) - 1);

    char *phone_str = argv[10] ? argv[10] : "";
    char *phone_token = strtok(phone_str, ";");
    newClient->phone_count = 0;
    while (phone_token && newClient->phone_count < 100)
    {
        strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[0]) - 1);
        newClient->phones[newClient->phone_count][sizeof(newClient->phones[0]) - 1] = '\0'; // 确保null终止
        newClient->phone_count++;
        phone_token = strtok(NULL, ";");
    }

    newClient->next = NULL;
    return newClient;
}

Client *addClient(Client *head, Client *newClient)
{
    if (newClient == NULL)
        return head;
    if (head != NULL)
    {
        Client *current = head;
        while (current->next != NULL)
            current = current->next;
        current->next = newClient;
    }
    else
        head = newClient;

    printf("客户 '%s' 添加成功！\n", newClient->name);
    return head;
}

Client *deleteClient(Client *head, int id)
{
    Client *current = head;
    Client *prev = NULL;
    // 查找要删除的节点
    while (current != NULL && current->id != id)
    {
        prev = current;
        current = current->next;
    }
    if (current == NULL)
    {
        return head; // 没找到
    }
    if (prev == NULL)
    {
        head = current->next; // 删除的是头节点
    }
    else
    {
        prev->next = current->next; // 从链表中移除
    }
    free(current); // 释放内存
    return head;
}

Client *modifyClient(Client *head, Client *newClient)
{
    if (head == NULL)
        return newClient;

    Client *current = head;
    Client *prev = NULL;

    while (current != NULL)
    {
        if (current->id == newClient->id)
        {
            if (current == head)
            {
                newClient->next = current->next;
                free(current);
                return newClient;
            }
            else
            {
                prev->next = newClient;
                newClient->next = current->next;
                free(current);
                return head;
            }
        }
        prev = current;
        current = current->next;
    }
    return head;
}

// 查询客户 (根据ID或名称等条件)
void queryClient(Client *head, int id)
{
    printf("client_manager: queryClient - 功能待实现\n");
}

int cmp(Client *a, Client *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->name, b->name);
    case 3:
        return strcmp(a->region, b->region);
    case 4:
        return strcmp(a->address, b->address);
    case 5:
        return strcmp(a->legal_person, b->legal_person);
    case 6:
        return a->size - b->size;
    case 7:
        return a->contact_level - b->contact_level;
    case 8:
        return strcmp(a->email, b->email);
    default:
        return 0;
    }
}
Client *mergeSortedLists(Client *list1, Client *list2, int argc, int a[])
{
    if (!list1)
        return list2; // 第一链表为空，返回第二链表
    if (!list2)
        return list1; // 第二链表为空，返回第一链表

    Client *sortedList = NULL;
    for (int i = 0; i < argc - 1; i++)
    {
        if (cmp(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeSortedLists(list1->next, list2, argc, a);
            break;
        }
        else if (cmp(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeSortedLists(list1, list2->next, argc, a);
            break;
        }
    }

    return sortedList;
}

void splitList(Client *head, Client **front, Client **back)
{
    Client *slow = head;
    Client *fast = head->next;

    // 使用快慢指针将链表分成两部分
    while (fast != NULL)
    {
        fast = fast->next;
        if (fast != NULL)
        {
            slow = slow->next;
            fast = fast->next;
        }
    }

    *front = head;      // 前半部分链表
    *back = slow->next; // 后半部分链表
    slow->next = NULL;  // 断开链表
}

// 排序函数
Client *mergeSort(Client *head, int argc, int a[])
{
    if (!head || !head->next)
    {
        return head; // 链表为空或只有一个元素，无需排序
    }

    Client *front = NULL;
    Client *back = NULL;

    // 拆分链表为前后两部分
    splitList(head, &front, &back);

    // 递归排序两部分
    front = mergeSort(front, argc, a);
    back = mergeSort(back, argc, a);

    // 合并两个有序链表
    return mergeSortedLists(front, back, argc, a);
}

void displayAllClients(Client *head, int argc, char *argv[]) // num用来指示按什么排序
{
    if (argc < 2)
        return;
    int a[argc - 1];
    for (int i = 0; i < argc - 2; i++)
        a[i] = atoi(argv[2 + i]);
    a[argc - 2] = 1;
    head = mergeSort(head, argc, a);
    Client *current = head;
    while (current)
    {
        printf("%d,", current->id);
        printf("%s,", current->name);
        printf("%s,", current->region);
        printf("%s,", current->address);
        printf("%s,", current->legal_person);
        printf("%d,", current->size);
        printf("%d,", current->contact_level);
        printf("%s,", current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            char phone[100];
            strncpy(phone, current->phones[i], sizeof(current->phones[i]) - 1);
            phone[sizeof(current->phones[i]) - 1] = '\0';
            printf("%s", phone);
            if (i != current->phone_count - 1)
                printf(";");
        }
        printf("\n");
        current = current->next;
    }
}

void freeClientList(Client *head)
{
    Client *current = head;
    Client *next;
    while (current != NULL)
    {
        next = current->next;
        free(current);
        current = next;
    }
}
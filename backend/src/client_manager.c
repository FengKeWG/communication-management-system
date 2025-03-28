#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "../include/client_manager.h"
#include "utils.h"

Client *parseClientFromArgs(int argc, char *argv[], bool newID)
{
    if (argc < 11)
        return NULL;

    Client *newClient = (Client *)malloc(sizeof(Client));
    if (!newClient)
        return NULL;
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
    case 9:
        return a->phone_count - b->phone_count;
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->name, a->name);
    case -3:
        return strcmp(b->region, a->region);
    case -4:
        return strcmp(b->address, a->address);
    case -5:
        return strcmp(b->legal_person, a->legal_person);
    case -6:
        return b->size - a->size;
    case -7:
        return b->contact_level - a->contact_level;
    case -8:
        return strcmp(b->email, a->email);
    case -9:
        return b->phone_count - a->phone_count;
    default:
        return 0;
    }
}

Client *mergeSortedLists(Client *list1, Client *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Client *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmp(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmp(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitList(Client *head, Client **front, Client **back)
{
    Client *slow = head;
    Client *fast = head->next;
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

Client *mergeSort(Client *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Client *front = NULL;
    Client *back = NULL;
    splitList(head, &front, &back);
    front = mergeSort(front, cnt, a);
    back = mergeSort(back, cnt, a);
    return mergeSortedLists(front, back, cnt, a);
}

void displayClients(Client *head, int argc, char *argv[])
{
    if (argc < 3)
        return;
    if (argc == 3)
    {
        argc++;
        argv[3] = "1";
    }
    int cnt = argc - 3;
    int a[cnt];
    for (int i = 0; i < cnt; i++)
        a[i] = atoi(argv[3 + i]);
    head = mergeSort(head, cnt, a);
    char pattern[10000] = "";
    strcat(pattern, argv[2]);
    toLower(pattern);
    Client *current = head;
    while (current)
    {
        char text[10000] = "";
        char tmp[50] = "";
        snprintf(tmp, sizeof(tmp), "%d", current->id);
        strcat(text, tmp);
        strcat(text, current->name);
        strcat(text, current->region);
        strcat(text, current->address);
        strcat(text, current->legal_person);
        snprintf(tmp, sizeof(tmp), "%d", current->size);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->contact_level);
        strcat(text, tmp);
        strcat(text, current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            strcat(text, current->phones[i]);
        }
        toLower(text);
        if (kmp(text, pattern) >= 0)
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
                char phone[100] = "";
                strncpy(phone, current->phones[i], sizeof(current->phones[i]) - 1);
                phone[sizeof(current->phones[i]) - 1] = '\0';
                printf("%s;", phone);
            }
            printf("\n");
        }
        current = current->next;
    }
}

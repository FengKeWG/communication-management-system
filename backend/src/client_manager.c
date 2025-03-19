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
        newClient->id = atoi(argv[2]);
    strncpy(newClient->name, argv[3], sizeof(newClient->name) - 1);
    strncpy(newClient->region, argv[4], sizeof(newClient->region) - 1);
    strncpy(newClient->address, argv[5], sizeof(newClient->address) - 1);
    strncpy(newClient->legal_person, argv[6], sizeof(newClient->legal_person) - 1);
    newClient->size = atoi(argv[7]);
    newClient->contact_level = atoi(argv[8]);
    strncpy(newClient->email, argv[9], sizeof(newClient->email) - 1);

    char *phone_token = strtok(argv[10], ";");
    newClient->phone_count = 0;
    while (phone_token && newClient->phone_count < 100)
    {
        strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[0]) - 1);
        newClient->phones[newClient->phone_count][sizeof(newClient->phones[0]) - 1] = '\0';
        newClient->phone_count++;
        phone_token = strtok(NULL, ";");
    }

    return newClient;
}

Client *addClient(Client *head, Client *newClient)
{
    if (!newClient)
        return head;
    if (head)
    {
        Client *current = head;
        while (current->next)
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
    Client *p1, *p2;
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

void displayAllClients(Client *head)
{
    Client *current = head;
    while (current)
    {
        printf("客户ID: ");
        printf("%d\n", current->id);
        printf("客户名称: ");
        printf("%s\n", current->name);
        printf("客户区域: ");
        printf("%s\n", current->region);
        printf("客户地址: ");
        printf("%s\n", current->address);
        printf("客户法人: ");
        printf("%s\n", current->legal_person);
        printf("客户规模: ");
        printf("%d\n", current->size);
        printf("业务联系程度: ");
        printf("%d\n", current->contact_level);
        printf("客户邮箱: ");
        printf("%s\n", current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            char phone[100];
            printf("电话号码 %d: ", i + 1);
            strncpy(phone, current->phones[i], sizeof(current->phones[i]) - 1);
            phone[sizeof(current->phones[i]) - 1] = '\0';
            printf("%s\n", phone);
        }
        current = current->next;
    }
}
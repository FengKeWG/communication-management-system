#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/client_manager.h"

Client *parseClientFromArgs(int argc, char *argv[])
{
    if (argc < 11)
    {
        fprintf(stderr, "参数数量不足。\n");
        return NULL;
    }

    Client *newClient = (Client *)malloc(sizeof(Client));
    if (!newClient)
    {
        perror("内存分配失败！");
        return NULL;
    }
    memset(newClient, 0, sizeof(Client));

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
    {
        perror("无效");
        return head;
    }
    if (head)
    {
        Client *current = head;
        while (current->next)
        {
            current = current->next;
        }
        current->next = newClient;
    }
    else
    {
        head = newClient;
    }

    printf("客户 '%s' 添加成功！\n", newClient->name);
    return head;
}

Client *deleteClient(Client *head, int id)
{
    printf("client_manager: deleteClient - 功能待实现\n");
    return head;
}

Client *modifyClient(Client *head, int id)
{
    printf("client_manager: modifyClient - 功能待实现\n");
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
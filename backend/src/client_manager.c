#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/client.h"
#include "../include/client_manager.h"

// 添加客户
Client *addClient(Client *head)
{
    Client *newClient = (Client *)malloc(sizeof(Client));
    if (newClient == NULL)
    {
        perror("内存分配失败！");
        return head;
    }
    memset(newClient, 0, sizeof(Client));

    scanf("%d", &newClient->id);
    getchar();
    fgets(newClient->name, sizeof(newClient->name), stdin);
    newClient->name[strcspn(newClient->name, "\n")] = '\0';
    fgets(newClient->region, sizeof(newClient->region), stdin);
    newClient->region[strcspn(newClient->region, "\n")] = '\0';
    fgets(newClient->address, sizeof(newClient->address), stdin);
    newClient->address[strcspn(newClient->address, "\n")] = '\0';
    fgets(newClient->legal_person, sizeof(newClient->legal_person), stdin);
    newClient->legal_person[strcspn(newClient->legal_person, "\n")] = '\0';
    scanf("%d", &newClient->size);
    getchar();
    scanf("%d", &newClient->contact_level);
    getchar();
    fgets(newClient->email, sizeof(newClient->email), stdin);
    newClient->email[strcspn(newClient->email, "\n")] = '\0';

    newClient->phone_count = 0;
    char phones[256];
    fgets(phones, sizeof(phones), stdin);
    phones[strcspn(phones, "\n")] = '\0';

    // 解析分号分隔的电话号码
    char *phone_token = strtok(phones, ";");
    while (phone_token != NULL && newClient->phone_count < 100)
    {
        strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[0]) - 1);
        newClient->phones[newClient->phone_count][sizeof(newClient->phones[0]) - 1] = '\0';
        newClient->phone_count++;
        phone_token = strtok(NULL, ";");
    }

    newClient->contact_count = 0;
    newClient->next = NULL;

    if (head == NULL)
    {
        head = newClient;
    }
    else
    {
        Client *current = head;
        while (current->next != NULL)
        {
            current = current->next;
        }
        current->next = newClient;
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

// 显示所有客户
void displayAllClients(Client *head)
{
    printf("client_manager: displayAllClients - 功能待实现\n");
}
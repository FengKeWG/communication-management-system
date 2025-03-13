#include <stdio.h>
#include <stdlib.h> // 为了使用 malloc 和 free
#include <string.h> // 为了使用 strcpy 等字符串函数
#include "../include/client.h"
#include "../include/client_manager.h"

// 添加客户
Client *addClient(Client *head)
{
    Client *newClient = (Client *)malloc(sizeof(Client));
    if (newClient == NULL)
    {
        perror("内存分配失败！");
        return head; // 内存分配失败，返回原来的链表头
    }
    memset(newClient, 0, sizeof(Client)); // 初始化新分配的内存

    printf("请输入客户信息:\n");

    printf("客户ID: "); // 假设 ID 是手动输入的，或者你可以在程序中自动生成
    scanf("%d", &newClient->id);
    getchar(); // 读取并丢弃换行符，防止影响后面的 fgets

    printf("客户名称: ");
    fgets(newClient->name, sizeof(newClient->name), stdin);
    newClient->name[strcspn(newClient->name, "\n")] = '\0'; // 去除 fgets 读取的换行符

    printf("客户区域: ");
    fgets(newClient->region, sizeof(newClient->region), stdin);
    newClient->region[strcspn(newClient->region, "\n")] = '\0';

    printf("客户地址: ");
    fgets(newClient->address, sizeof(newClient->address), stdin);
    newClient->address[strcspn(newClient->address, "\n")] = '\0';

    printf("客户法人: ");
    fgets(newClient->legal_person, sizeof(newClient->legal_person), stdin);
    newClient->legal_person[strcspn(newClient->legal_person, "\n")] = '\0';

    printf("客户规模 (1-大, 2-中, 3-小): ");
    scanf("%d", &newClient->size);
    getchar(); // 读取并丢弃换行符

    printf("业务联系程度 (1-高, 2-中, 3-低): ");
    scanf("%d", &newClient->contact_level);
    getchar(); // 读取并丢弃换行符

    printf("客户邮箱: ");
    fgets(newClient->email, sizeof(newClient->email), stdin);
    newClient->email[strcspn(newClient->email, "\n")] = '\0';

    newClient->phone_count = 0;
    printf("请输入客户电话号码 (最多 %d 个，输入空行结束):\n", 100);
    for (int i = 0; i < 100; i++)
    {
        char phone[100];
        printf("电话号码 %d: ", i + 1);
        fgets(phone, sizeof(phone), stdin);
        phone[strcspn(phone, "\n")] = '\0';
        if (strlen(phone) == 0)
        { // 输入空行结束
            break;
        }
        strncpy(newClient->phones[i], phone, sizeof(newClient->phones[i]) - 1);
        newClient->phones[i][sizeof(newClient->phones[i]) - 1] = '\0';
        newClient->phone_count++;
    }

    newClient->contact_count = 0; // 初始化联络员计数 (目前还没有联络员)
    newClient->next = NULL;

    // 将新客户添加到链表末尾
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
    return head; // 返回更新后的链表头
}

// 删除客户 (根据ID)
Client *deleteClient(Client *head, int id)
{
    printf("client_manager: deleteClient - 功能待实现\n");
    return head;
}

// 修改客户信息 (根据ID)
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
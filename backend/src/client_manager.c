#include <stdio.h>
#include <stdlib.h> // 为了使用 malloc 和 free
#include <string.h> // 为了使用 strcpy 等字符串函数
#include "../include/client.h"
#include "../include/client_manager.h"

// 添加客户
Client *addClient(Client *head)
{
    // 分配一个新的 Client 结构体的内存空间
    // malloc() 函数用于在堆上分配内存。sizeof(Client) 计算 Client 结构体的大小（字节数）。
    // (Client *) 是类型转换，将 malloc 返回的 void 指针转换为 Client 类型的指针。
    Client *newClient = (Client *)malloc(sizeof(Client));

    // 检查内存分配是否成功。如果 malloc 失败，会返回 NULL。
    if (newClient == NULL)
    {
        // perror() 函数用于输出错误信息。参数是自定义的错误提示字符串。
        // perror() 会将错误信息输出到标准错误输出 (stderr)，通常是控制台。
        perror("内存分配失败！");

        // 如果内存分配失败，则返回原来的链表头，避免程序崩溃。
        return head; // 内存分配失败，返回原来的链表头
    }

    // 使用 memset() 函数将新分配的内存初始化为 0。
    // 这样可以确保新客户结构体中的所有字段都处于一个已知的初始状态。
    // memset() 函数的参数：
    //  - newClient: 指向要填充的内存块的指针。
    //  - 0: 要填充的值（这里是 0）。
    //  - sizeof(Client): 要填充的字节数。
    memset(newClient, 0, sizeof(Client)); // 初始化新分配的内存

    // 打印提示信息，要求用户输入客户信息。
    printf("请输入客户信息:\n");

    // 提示用户输入客户 ID。
    printf("客户ID: "); // 假设 ID 是手动输入的，或者你可以在程序中自动生成

    // 使用 scanf() 函数读取用户输入的整数，并将其存储到 newClient->id 中。
    // &newClient->id 是 newClient 结构体中 id 字段的地址。
    scanf("%d", &newClient->id);

    // getchar() 函数用于读取一个字符，通常用于消耗掉输入缓冲区中的换行符。
    // scanf() 函数在读取完数字后，会将换行符留在输入缓冲区中。
    // 如果不清除换行符，它可能会被后面的 fgets() 函数读取，导致问题。
    getchar(); // 读取并丢弃换行符，防止影响后面的 fgets

    // 提示用户输入客户名称。
    printf("客户名称: ");

    // 使用 fgets() 函数从标准输入 (stdin) 读取一行文本，并将其存储到 newClient->name 中。
    // fgets() 函数的参数：
    //  - newClient->name: 存储文本的字符数组。
    //  - sizeof(newClient->name): 字符数组的大小（最大读取字符数）。
    //  - stdin: 标准输入流（通常是键盘）。
    fgets(newClient->name, sizeof(newClient->name), stdin);

    // fgets() 函数会在读取的字符串末尾添加一个换行符 (\n)。
    // strcspn() 函数用于查找字符串中第一个出现换行符的位置。
    // 然后，将换行符替换为 null 终止符 (\0)，以确保字符串正确终止。
    newClient->name[strcspn(newClient->name, "\n")] = '\0'; // 去除 fgets 读取的换行符

    // 提示用户输入客户区域。
    printf("客户区域: ");
    fgets(newClient->region, sizeof(newClient->region), stdin);
    newClient->region[strcspn(newClient->region, "\n")] = '\0';

    // 提示用户输入客户地址。
    printf("客户地址: ");
    fgets(newClient->address, sizeof(newClient->address), stdin);
    newClient->address[strcspn(newClient->address, "\n")] = '\0';

    // 提示用户输入客户法人。
    printf("客户法人: ");
    fgets(newClient->legal_person, sizeof(newClient->legal_person), stdin);
    newClient->legal_person[strcspn(newClient->legal_person, "\n")] = '\0';

    // 提示用户输入客户规模。
    printf("客户规模 (1-大, 2-中, 3-小): ");
    scanf("%d", &newClient->size);
    getchar(); // 读取并丢弃换行符

    // 提示用户输入业务联系程度。
    printf("业务联系程度 (1-高, 2-中, 3-低): ");
    scanf("%d", &newClient->contact_level);
    getchar(); // 读取并丢弃换行符

    // 提示用户输入客户邮箱。
    printf("客户邮箱: ");
    fgets(newClient->email, sizeof(newClient->email), stdin);
    newClient->email[strcspn(newClient->email, "\n")] = '\0';

    // 初始化电话号码计数器。
    newClient->phone_count = 0;

    // 提示用户输入客户电话号码。
    printf("请输入客户电话号码 (最多 %d 个，输入空行结束):\n", 100);

    // 使用循环读取最多 100 个电话号码。
    for (int i = 0; i < 100; i++)
    {
        // 声明一个临时字符数组，用于存储每次读取的电话号码。
        char phone[100];

        // 提示用户输入电话号码。
        printf("电话号码 %d: ", i + 1);

        // 使用 fgets() 函数从标准输入读取电话号码。
        fgets(phone, sizeof(phone), stdin);

        // 移除fgets读取的换行符
        phone[strcspn(phone, "\n")] = '\0';

        // 检查用户是否输入了空行。如果输入了空行，则退出循环。
        if (strlen(phone) == 0)
        { // 输入空行结束
            break;
        }

        // 使用 strncpy() 函数将电话号码复制到 newClient->phones 数组中。
        // strncpy() 函数可以防止缓冲区溢出。
        // sizeof(newClient->phones[i]) - 1 确保为 null 终止符保留一个字符的空间。
        strncpy(newClient->phones[i], phone, sizeof(newClient->phones[i]) - 1);

        // 确保电话号码以 null 终止符结尾。
        newClient->phones[i][sizeof(newClient->phones[i]) - 1] = '\0';

        // 增加电话号码计数器。
        newClient->phone_count++;
    }

    // 初始化联络员计数 (目前还没有联络员)
    newClient->contact_count = 0;

    // 将新客户的 next 指针设置为 NULL，表示它是链表的最后一个节点。
    newClient->next = NULL;

    // 将新客户添加到链表末尾。
    if (head == NULL)
    {
        // 如果链表为空，则将新客户设置为链表的头。
        head = newClient;
    }
    else
    {
        // 如果链表不为空，则找到链表的最后一个节点。
        Client *current = head;
        while (current->next != NULL)
        {
            current = current->next;
        }
        // 将新客户添加到链表的末尾。
        current->next = newClient;
    }

    // 打印客户添加成功的消息。
    printf("客户 '%s' 添加成功！\n", newClient->name);

    // 返回更新后的链表头。
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
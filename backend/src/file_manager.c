#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "..\include\file_manager.h"

// -----  客户数据文件操作 -----
Client *loadClientsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r"); // 以只读方式打开文件
    if (fp == NULL)
    {
        perror("读取文件错误！");
        return NULL; // 文件打开失败，返回 NULL
    }

    Client *head = NULL; // 链表头指针，初始为空
    Client *tail = NULL; // 链表尾指针，用于快速添加到链表末尾
    char line[1024];     // 假设每行最长 1024 字符 (要足够长容纳所有字段)

    while (fgets(line, sizeof(line), fp) != NULL)
    { // 逐行读取文件
        // 跳过空行和注释行 (以 # 开头的行)
        if (line[0] == '\n' || line[0] == '#')
        {
            continue;
        }

        Client *newClient = (Client *)malloc(sizeof(Client)); // 为新客户分配内存
        if (newClient == NULL)
        {
            perror("内存分配失败！");
            fclose(fp);
            // 内存分配失败，需要清理已分配的链表 (这里为了简化例子，省略了链表清理代码)
            return NULL; // 内存分配失败
        }
        memset(newClient, 0, sizeof(Client)); // 初始化新分配的内存

        // 解析 CSV 行，并将数据填充到 newClient 的各个字段
        // CSV 格式假设为: id,name,region,address,legal_person,size,contact_level,email,phone1;phone2;...
        char *token;
        char *rest = line;

        // 读取 ID
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->id = atoi(token);
        }

        // 读取 name
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->name, token, sizeof(newClient->name) - 1);
            newClient->name[sizeof(newClient->name) - 1] = '\0'; // 确保字符串以 null 结尾
        }

        // 读取 region
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->region, token, sizeof(newClient->region) - 1);
            newClient->region[sizeof(newClient->region) - 1] = '\0';
        }

        // 读取 address
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->address, token, sizeof(newClient->address) - 1);
            newClient->address[sizeof(newClient->address) - 1] = '\0';
        }

        // 读取 legal_person
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->legal_person, token, sizeof(newClient->legal_person) - 1);
            newClient->legal_person[sizeof(newClient->legal_person) - 1] = '\0';
        }

        // 读取 size
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->size = atoi(token);
        }

        // 读取 contact_level
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->contact_level = atoi(token);
        }

        // 读取 email
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->email, token, sizeof(newClient->email) - 1);
            newClient->email[sizeof(newClient->email) - 1] = '\0';
        }

        // 读取 phones (多个电话号码，用 ; 分隔)
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            char *phone_token;
            char *phone_rest = token;
            newClient->phone_count = 0;
            while ((phone_token = strtok_r(phone_rest, ";", &phone_rest)) != NULL && newClient->phone_count < 100)
            {
                strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[newClient->phone_count]) - 1);
                newClient->phones[newClient->phone_count][sizeof(newClient->phones[newClient->phone_count]) - 1] = '\0';
                newClient->phone_count++;
            }
        }

        newClient->contact_count = 0; // 初始化联络员计数
        newClient->next = NULL;       // 新节点的 next 指针置空

        if (head == NULL)
        { // 如果链表为空，新节点就是头节点
            head = newClient;
            tail = newClient;
        }
        else
        { // 链表非空，将新节点添加到链表末尾
            tail->next = newClient;
            tail = newClient;
        }
    }

    fclose(fp);  // 关闭文件
    return head; // 返回链表头指针
}

int saveClientsToFile(const char *filename, Client *head)
{
    FILE *fp = fopen(filename, "w"); // 以写入方式打开文件，会覆盖原有内容
    if (fp == NULL)
    {
        perror("写入文件错误！");
        return -1; // 文件打开失败
    }

    Client *current = head;
    while (current != NULL)
    {
        // 写入 CSV 格式的客户数据
        fprintf(fp, "%d,%s,%s,%s,%s,%d,%d,%s,",
                current->id, current->name, current->region, current->address,
                current->legal_person, current->size, current->contact_level,
                current->email);

        // 写入电话号码 (用 ; 分隔)
        for (int i = 0; i < current->phone_count; i++)
        {
            fprintf(fp, "%s", current->phones[i]);
            if (i < current->phone_count - 1)
            {
                fprintf(fp, ";"); // 多个电话号码之间用 ; 分隔
            }
        }
        fprintf(fp, "\n"); // 换行

        current = current->next; // 移动到下一个客户节点
    }

    fclose(fp); // 关闭文件
    return 0;   // 成功保存
}

// -----  联络员数据文件操作 -----
Contact *loadContactsFromFile(const char *filename)
{
    printf("file_manager: loadContactsFromFile - 功能待实现\n");
    return NULL;
}

int saveContactsToFile(const char *filename, Contact *head)
{
    printf("file_manager: saveContactsToFile - 功能待实现\n");
    return 0;
}

// -----  业务员数据文件操作 -----
Employee *loadEmployeesFromFile(const char *filename)
{
    printf("file_manager: loadEmployeesFromFile - 功能待实现\n");
    return NULL;
}

int saveEmployeesToFile(const char *filename, Employee *head)
{
    printf("file_manager: saveEmployeesToFile - 功能待实现\n");
    return 0;
}

// -----  通信记录数据文件操作 -----
CommunicationRecord *loadCommunicationsFromFile(const char *filename)
{
    printf("file_manager: loadCommunicationsFromFile - 功能待实现\n");
    return NULL;
}

int saveCommunicationsToFile(const char *filename, CommunicationRecord *head)
{
    printf("file_manager: saveCommunicationsToFile - 功能待实现\n");
    return 0;
}

// -----  客户分组数据文件操作 -----
Group *loadGroupsFromFile(const char *filename)
{
    printf("file_manager: loadGroupsFromFile - 功能待实现\n");
    return NULL;
}

int saveGroupsToFile(const char *filename, Group *head)
{
    printf("file_manager: saveGroupsToFile - 功能待实现\n");
    return 0;
}
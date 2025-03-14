#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/file_manager.h"

// -----  客户数据文件操作 -----

// 函数功能：从指定的文件中加载客户数据，并构建客户信息链表。
// 参数：filename (const char *) - 指向文件名的字符串，该文件包含客户数据。const 关键字表示函数不会修改这个字符串。
// 返回值：Client * - 指向链表头部的指针。如果加载失败（例如，文件无法打开或内存分配失败），则返回 NULL。
Client *loadClientsFromFile(const char *filename)
{
    // FILE *fp：声明一个 FILE 类型的指针变量 fp。FILE 是 C 语言标准库中定义的一个结构体，用于表示文件流。
    // fopen(filename, "r")：使用 fopen 函数打开文件。
    //   - filename：要打开的文件名（字符串）。
    //   - "r"：打开模式，表示以只读方式打开文件。
    // 如果文件成功打开，fopen 函数返回一个指向 FILE 结构体的指针，否则返回 NULL。
    FILE *fp = fopen(filename, "r"); // 以只读方式打开文件

    // 检查文件是否成功打开。如果 fopen 函数返回 NULL，说明文件打开失败。
    if (fp == NULL)
    {
        // perror("读取文件错误！")：使用 perror 函数输出错误信息到标准错误输出（通常是控制台）。
        //   - perror 函数会输出你提供的字符串，并在后面追加与 errno 全局变量相关的错误信息。errno 通常由文件操作等函数设置，用于指示发生的错误类型。
        perror("读取文件错误！");
        // return NULL：如果文件打开失败，函数返回 NULL，表示加载数据失败。
        return NULL; // 文件打开失败，返回 NULL
    }

    // Client *head = NULL：声明一个 Client 类型的指针变量 head，并将其初始化为 NULL。
    //   - Client：假设有一个名为 Client 的结构体，用于存储客户信息。
    //   - *head：head 是一个指针，用于指向 Client 结构体的实例。
    //   - NULL：表示 head 当前不指向任何有效的内存地址，即链表为空。
    Client *head = NULL; // 链表头指针，初始为空

    // Client *tail = NULL：声明一个 Client 类型的指针变量 tail，并将其初始化为 NULL。
    //   - tail 指针用于在链表末尾快速添加新的客户信息。
    Client *tail = NULL; // 链表尾指针，用于快速添加到链表末尾

    // char line[1024]：声明一个字符数组 line，用于存储从文件中读取的一行数据。
    //   - char：表示字符类型。
    //   - line[1024]：表示 line 数组可以存储 1024 个字符。
    //   - 假设每行最长 1024 字符 (要足够长容纳所有字段)
    char line[1024]; // 假设每行最长 1024 字符 (要足够长容纳所有字段)

    // while (fgets(line, sizeof(line), fp) != NULL)：使用 while 循环逐行读取文件内容。
    //   - fgets(line, sizeof(line), fp)：从文件指针 fp 指向的文件中读取一行数据，并存储到 line 数组中。
    //     - line：存储读取到的数据的字符数组。
    //     - sizeof(line)：line 数组的大小（以字节为单位），用于限制 fgets 函数读取的最大字符数，防止缓冲区溢出。
    //     - fp：文件指针，指向要读取的文件。
    //   - fgets 函数读取成功时返回 line 指针，读取失败或到达文件末尾时返回 NULL。
    // 循环会一直执行，直到 fgets 函数返回 NULL，表示文件读取完毕。
    while (fgets(line, sizeof(line), fp) != NULL)
    { // 逐行读取文件

        // 跳过空行和注释行 (以 # 开头的行)
        // if (line[0] == '\n' || line[0] == '#')：检查当前行是否为空行（第一个字符是换行符 '\n'）或者注释行（第一个字符是 '#'）。
        // continue：如果当前行是空行或注释行，则跳过当前循环的剩余部分，直接进入下一次循环，读取下一行数据。
        if (line[0] == '\n' || line[0] == '#')
        {
            continue;
        }

        // Client *newClient = (Client *)malloc(sizeof(Client))：为新的客户信息分配内存。
        //   - malloc(sizeof(Client))：使用 malloc 函数分配一块足够存储 Client 结构体的内存空间。sizeof(Client) 计算 Client 结构体的大小（以字节为单位）。
        //   - (Client *)：将 malloc 函数返回的 void 指针强制转换为 Client 类型的指针。
        Client *newClient = (Client *)malloc(sizeof(Client)); // 为新客户分配内存

        // if (newClient == NULL)：检查内存是否成功分配。如果 malloc 函数返回 NULL，说明内存分配失败。
        if (newClient == NULL)
        {
            // perror("内存分配失败！")：使用 perror 函数输出错误信息。
            perror("内存分配失败！");
            // fclose(fp)：关闭文件指针，释放文件资源。
            fclose(fp);
            // return NULL：返回 NULL，表示加载数据失败。
            // 内存分配失败，需要清理已分配的链表 (这里为了简化例子，省略了链表清理代码)
            return NULL; // 内存分配失败
        }

        // memset(newClient, 0, sizeof(Client))：将新分配的内存初始化为 0。
        //   - memset 函数将从 newClient 指针开始的 sizeof(Client) 字节的内存区域设置为 0。
        //   - 这可以确保新客户结构体中的所有字段都处于一个已知的初始状态。
        memset(newClient, 0, sizeof(Client)); // 初始化新分配的内存

        // 解析 CSV 行，并将数据填充到 newClient 的各个字段
        // CSV 格式假设为: id,name,region,address,legal_person,size,contact_level,email,phone1;phone2;...
        // char *token：声明一个字符指针 token，用于指向分割后的字符串（即 CSV 文件中的每个字段）。
        char *token;
        // char *rest = line：声明一个字符指针 rest，并将其初始化为 line，指向当前行的字符串。rest 指针用于在后续的字符串分割操作中跟踪剩余未分割的字符串。
        char *rest = line;

        // 读取 ID
        // token = strtok_r(rest, ",", &rest)：使用 strtok_r 函数分割字符串。
        // strtok_r 函数将字符串 rest 以 "," 为分隔符进行分割，并将分割后的第一个子字符串的指针赋值给 token。同时，strtok_r 函数会更新 rest 指针，使其指向剩余未分割的字符串。
        token = strtok_r(rest, ",", &rest);
        // if (token != NULL)：检查 token 是否为 NULL。如果 token 不为 NULL，表示成功分割出了一个子字符串（即 CSV 文件中的一个字段）。
        if (token != NULL)
        {
            // newClient->id = atoi(token)：将分割出的子字符串转换为整数，并赋值给 newClient 结构体的 id 字段。
            // atoi 函数将字符串转换为整数。
            newClient->id = atoi(token);
        }

        // 读取 name
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            // strncpy(newClient->name, token, sizeof(newClient->name) - 1)：将分割出的子字符串复制到 newClient 结构体的 name 字段。
            // strncpy 函数用于复制字符串，可以防止缓冲区溢出。
            // strncpy(dest, src, n) 从源 src 复制最多 n 个字符到目标 dest。
            strncpy(newClient->name, token, sizeof(newClient->name) - 1);
            // 确保字符串以 null 结尾
            // newClient->name[sizeof(newClient->name) - 1] = '\0'：在 name 字段的末尾添加 null 终止符 '\0'，以确保它是一个有效的 C 字符串。
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
            // char *phone_token：声明一个字符指针 phone_token，用于指向分割后的电话号码。
            char *phone_token;
            // char *phone_rest = token：声明一个字符指针 phone_rest，并将其初始化为 token，指向包含电话号码的字符串。
            char *phone_rest = token;
            // newClient->phone_count = 0：初始化 newClient 结构体的 phone_count 字段为 0，表示当前客户的电话号码数量为 0。
            newClient->phone_count = 0;

            // 循环读取电话号码
            // while ((phone_token = strtok_r(phone_rest, ";", &phone_rest)) != NULL && newClient->phone_count < 100)：使用 while 循环分割电话号码字符串。
            // phone_token = strtok_r(phone_rest, ";", &phone_rest)：使用 strtok_r 函数以 ";" 为分隔符分割电话号码字符串，并将分割后的电话号码的指针赋值给 phone_token。
            // phone_token != NULL：检查 phone_token 是否为 NULL。如果 phone_token 不为 NULL，表示成功分割出了一个电话号码。
            // newClient->phone_count < 100：检查当前客户的电话号码数量是否小于 100。这是为了防止电话号码数量超过 phones 数组的大小，导致缓冲区溢出。
            while ((phone_token = strtok_r(phone_rest, ";", &phone_rest)) != NULL && newClient->phone_count < 100)
            {
                // strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[newClient->phone_count]) - 1)：将分割出的电话号码复制到 newClient 结构体的 phones 数组中。
                strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[newClient->phone_count]) - 1);
                // newClient->phones[newClient->phone_count][sizeof(newClient->phones[newClient->phone_count]) - 1] = '\0'：在电话号码的末尾添加 null 终止符 '\0'，以确保它是一个有效的 C 字符串。
                newClient->phones[newClient->phone_count][sizeof(newClient->phones[newClient->phone_count]) - 1] = '\0';
                // newClient->phone_count++：将 newClient 结构体的 phone_count 字段加 1，表示当前客户的电话号码数量增加了一个。
                newClient->phone_count++;
            }
        }

        newClient->contact_count = 0; // 初始化联络员计数
        newClient->next = NULL;       // 新节点的 next 指针置空

        // 如果链表为空，新节点就是头节点
        // if (head == NULL)：检查链表是否为空。如果 head 为 NULL，表示链表为空。
        if (head == NULL)
        { // 如果链表为空，新节点就是头节点
            // head = newClient：将 head 指针指向新创建的 newClient 节点，使其成为链表的头节点。
            head = newClient;
            // tail = newClient：将 tail 指针指向新创建的 newClient 节点，使其成为链表的尾节点。
            tail = newClient;
        }
        // 如果链表非空，将新节点添加到链表末尾
        // else：如果链表不为空，则执行 else 块中的代码。
        else
        { // 链表非空，将新节点添加到链表末尾
            // tail->next = newClient：将当前尾节点的 next 指针指向新创建的 newClient 节点，使其成为链表的新的尾节点。
            tail->next = newClient;
            // tail = newClient：将 tail 指针指向新创建的 newClient 节点，使其成为链表的新的尾节点。
            tail = newClient;
        }
    }

    // fclose(fp)：关闭文件指针，释放文件资源。
    fclose(fp); // 关闭文件
    // return head：返回链表的头指针 head。
    return head; // 返回链表头指针
}

// 函数功能：将客户信息链表中的数据保存到指定的文件中。
// 参数：filename (const char *) - 指向文件名的字符串，该文件用于存储客户数据。
// 参数：head (Client *) - 指向链表头部的指针，该链表包含要保存的客户数据。
// 返回值：int - 0 表示保存成功，-1 表示保存失败。
int saveClientsToFile(const char *filename, Client *head)
{
    // 以写入方式打开文件，会覆盖原有内容
    // FILE *fp = fopen(filename, "w")：使用 fopen 函数打开文件。
    // filename：要打开的文件名（字符串）。
    //"w"：打开模式，表示以写入方式打开文件。如果文件已存在，则会覆盖原有内容。
    // 如果文件成功打开，fopen 函数返回一个指向 FILE 结构体的指针，否则返回 NULL。
    FILE *fp = fopen(filename, "w"); // 以写入方式打开文件，会覆盖原有内容

    // if (fp == NULL)：检查文件是否成功打开。如果 fopen 函数返回 NULL，说明文件打开失败。
    if (fp == NULL)
    {
        // perror("写入文件错误！")：使用 perror 函数输出错误信息。
        perror("写入文件错误！");
        // return -1：如果文件打开失败，函数返回 -1，表示保存数据失败。
        return -1; // 文件打开失败
    }

    // Client *current = head：声明一个 Client 类型的指针变量 current，并将其初始化为 head，指向链表的头部。
    Client *current = head;

    // while (current != NULL)：使用 while 循环遍历链表中的每个客户信息。
    while (current != NULL)
    {
        // fprintf(fp, "%d,%s,%s,%s,%s,%d,%d,%s,",
        // current->id, current->name, current->region, current->address,
        // current->legal_person, current->size, current->contact_level,
        // current->email);：使用 fprintf 函数将客户信息格式化为 CSV 字符串，并写入到文件中。
        // fprintf(file, format, ...)：将格式化的数据写入到指定的文件中。
        // file：文件指针，指向要写入的文件。
        // format：格式化字符串，用于指定要写入的数据的格式。
        //...：要写入的数据。
        //  写入 CSV 格式的客户数据
        fprintf(fp, "%d,%s,%s,%s,%s,%d,%d,%s,",
                current->id, current->name, current->region, current->address,
                current->legal_person, current->size, current->contact_level,
                current->email);

        // 写入电话号码 (用 ; 分隔)
        // for (int i = 0; i < current->phone_count; i++)：使用 for 循环遍历客户的每个电话号码。
        for (int i = 0; i < current->phone_count; i++)
        {
            // fprintf(fp, "%s", current->phones[i])：将电话号码写入到文件中。
            fprintf(fp, "%s", current->phones[i]);
            // if (i < current->phone_count - 1)：检查当前电话号码是否是最后一个电话号码。
            if (i < current->phone_count - 1)
            {
                // fprintf(fp, ";")：如果当前电话号码不是最后一个电话号码，则写入一个分号 ";"，用于分隔电话号码。
                fprintf(fp, ";"); // 多个电话号码之间用 ; 分隔
            }
        }
        // fprintf(fp, "\n")：写入一个换行符 "\n"，用于分隔不同的客户信息。
        fprintf(fp, "\n"); // 换行
        // current = current->next：将 current 指针指向链表中的下一个节点，以便遍历下一个客户信息。
        current = current->next; // 移动到下一个客户节点
    }

    // fclose(fp)：关闭文件指针，释放文件资源。
    fclose(fp); // 关闭文件
    // return 0：返回 0，表示保存数据成功。
    return 0; // 成功保存
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
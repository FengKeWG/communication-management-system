#ifndef FILE_MANAGER_H
#define FILE_MANAGER_H

// 文件管理模块的函数声明，例如：
// - 加载数据函数 (从文件读取数据到内存)
// - 保存数据函数 (将内存数据写入文件)

// 假设数据存储在链表中，我们需要传递链表头指针
#include "client.h"
#include "contact.h"
#include "employee.h"
#include "communication.h"
#include "group.h"

// 函数原型声明
Client *loadClientsFromFile(const char *filename);
int saveClientsToFile(const char *filename, Client *head);

Contact *loadContactsFromFile(const char *filename);
int saveContactsToFile(const char *filename, Contact *head);

Employee *loadEmployeesFromFile(const char *filename);
int saveEmployeesToFile(const char *filename, Employee *head);

CommunicationRecord *loadCommunicationsFromFile(const char *filename);
int saveCommunicationsToFile(const char *filename, CommunicationRecord *head);

Group *loadGroupsFromFile(const char *filename);
int saveGroupsToFile(const char *filename, Group *head);

#endif
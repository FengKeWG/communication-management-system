#ifndef GROUP_H
#define GROUP_H

typedef struct Group
{
    int id;
    char name[100];
    int client_ids[100]; // 存储客户ID，假设一个分组最多100个客户
    int client_count;
    struct Group *next;
} Group;

#endif
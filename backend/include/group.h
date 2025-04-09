#ifndef GROUP_H
#define GROUP_H

typedef struct Group
{
    int id;
    char name[100];
    int client_ids[10000];
    int client_count;
    struct Group *next;
} Group;

#endif
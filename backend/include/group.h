typedef struct Group
{
    int id;
    char name[50];      // 组名
    struct Group *next; // 链表链接
} Group;
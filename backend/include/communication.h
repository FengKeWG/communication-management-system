typedef struct Communication
{
    int id;
    int client_id;
    int contact_id;
    int employee_id;
    char time[25]; // 2024-12-15-17-56-19
    int duration;  // 分钟数
    char content[1000];
    struct Communication *next;
} Communication;
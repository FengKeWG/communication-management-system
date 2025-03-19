#include "utils.h"

void hashPassword(const char *password, char *hash_out)
{
    unsigned long hash = 5381;
    int c;
    while ((c = *password++))
    {
        hash = ((hash << 5) + hash) + c;
    }
    snprintf(hash_out, 65, "%lx", hash);
}
int uidGenerate()
{
    static unsigned int counter = 0;
    static time_t lastTime = 0;

    time_t currentTime = time(NULL);

    if (currentTime != lastTime)
    {
        srand((unsigned int)currentTime);
        counter = 0;
        lastTime = currentTime;
    }
    else
    {
        counter = (counter + 1) % 100;
    }

    int leading = (rand() % 9) + 1;
    int timePart = currentTime % 100000;
    int counterPart = counter;

    int uid = leading * 1000000 + timePart * 100 + counterPart;

    if (uid < 10000000)
    {
        uid += 10000000;
    }

    return uid;
}
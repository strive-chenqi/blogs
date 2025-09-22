[TOC]

------

# 一、网络编程基础API

## （一）基础小项目

实现回声服务器的客户端/服务器程序，客户端通过网络连接到服务器，并发送任意一串英文信息，服务器端接收信息后，将每个字符转换为大写并回送给客户端显示：

echo_server.cpp

```cpp
#include <stdio.h>
#include <libgen.h>
#include <stdlib.h>
#include <netinet/in.h>
#include <strings.h>
#include <arpa/inet.h>
#include <assert.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>
#include <ctype.h>

#define BUF_SIZE 1024

int main(int argc, char*   argv[]) {
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));  //<libgen.h>
        return 1;
    }

    const char*   ip = argv[1];
    int port = atoi(argv[2]);  //<stdlib.h>  ASCII to interger

    struct sockaddr_in address;  //<netinet/in.h>
    bzero(&address, sizeof(address)); //<strings.h>
    address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &address.sin_addr); //<arpa/inet.h>
    address.sin_port = htons(port);

    int listenfd = socket(PF_INET, SOCK_STREAM, 0);
    assert(listenfd >= 0); //<assert.h>

    int ret = 0;
    ret = bind(listenfd, (struct sockaddr*  )&address, sizeof(address));
    assert(ret != -1);

    ret = listen(listenfd, 5);
    assert(ret != -1);




    struct sockaddr_in client;
    socklen_t client_addrlength = sizeof(client);
    int connfd = accept(listenfd, (struct sockaddr*  )&client, &client_addrlength);
    if (connfd < 0)
    {
        printf("errno is: %d\n", errno); //<errno.h>
    }
    else
    {
        char buffer[BUF_SIZE];

        memset(buffer, '\0', BUF_SIZE); //<string.h>
        ret = recv(connfd, buffer, BUF_SIZE - 1, 0);
        printf("got %d bytes of normal data '%s'\n", ret, buffer);


        //转换成大写
        for (int i = 0; i < ret; i++) {
            /*if(buf[i]>='a' && buf[i]<='z'){
                buf[i] = buf[i] - 32;
            }*/
            buffer[i] = toupper(buffer[i]); //<ctype.h>
        }

        ret = send(connfd, buffer, ret, 0);
        printf("Successfully sent after converting to uppercase, len: %d\n",ret);

        close(connfd); //<unistd.h>
    }
	return 0;
}
```

echo_client.cpp

```cpp
#include <stdio.h>
#include <libgen.h>
#include <stdlib.h>
#include <netinet/in.h>
#include <strings.h>
#include <arpa/inet.h>
#include <assert.h>
#include <unistd.h>
#include <string.h>

#define BUF_SIZE 1024

int main(int argc, char*   argv[]) {
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));  //<libgen.h>
        return 1;
    }

    const char*   ip = argv[1];
    int port = atoi(argv[2]);  //<stdlib.h>

    struct sockaddr_in server_address;  //<netinet/in.h>
    bzero(&server_address, sizeof(server_address)); //<strings.h>
    server_address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &server_address.sin_addr); //<arpa/inet.h>
    server_address.sin_port = htons(port);

    int sockfd = socket(PF_INET, SOCK_STREAM, 0);
    assert(sockfd >= 0); //<assert.h>

    if (connect(sockfd, (struct sockaddr*  )&server_address, sizeof(server_address)) < 0) {
        printf("connection failed\n");
        close(sockfd);  //<unistd.h>
        return 1;
    }

    int ret = 0;
    const char*   message = "echo_server test";
    char buffer[BUF_SIZE];

    send(sockfd, message, strlen(message), 0);  //<string.h>  不能用sizeof，那个算出来是一个指针message所占的空间大小
    printf("send: %s\n", message);
    ret = recv(sockfd, buffer, BUF_SIZE-1, 0);  //或者是sizeof(buf)-1， 因为一个char占一个字节

    if (ret > 0) {
        buffer[ret] = '\0';             //这个其实可以在之前用memset(buffer, '\0', BUF_SIZE); 替代
        printf("receive: %s\n", buffer);
    }
    else {
        perror("error!!!");
    }

    close(sockfd);

    return 0;
}
```

> basename()是一个Linux系统编程常用的C语言库函数,包含在头文件<libgen.h>中。basename()函数的作用是从一个路径中提取文件名部分。主要的原型如下:
>
> ```cpp
> char* basename(char* path);
> ```
>
> - 给定一个文件路径，basename会返回指向路径中最后一个'/'后的文件名部分字符串的指针。如果路径中不包含'/'，则直接返回整个路径字符串。例如:
>
>
> ```html
> 路径:/home/user/file.txt
> 调用:basename("/home/user/file.txt")
> 返回:"file.txt"
> ```
>
> - basename()不会修改原输入字符串，只是返回一个指针，指向路径中的文件名部分。并且返回的字符串指针是指向原输入路径字符串中的一部分,并没有新分配内存，具体来说，basename()的返回值是指向路径输入字符串中最后一个'/'字符后面的子串,只是将原字符串中的一段取出来返回,没有复制和新分配内存。例如:
>
>
> ```cpp
> char path[] = "/home/user/file.txt";
> char* name = basename(path); 
> ```
>
> 这里name指向的是path字符串中"file.txt"的首地址，并没有分配新的内存。所以不需要再特别释放name指向的内存。basename()的原型中也没有类似malloc/free那种需要释放内存的函数,它仅仅是返回一个指针而已。

## （二）背景知识

**Socket通信模型：**

![](assets/224de22f56c99443991abf22e7d59ce3.png)

**Socket套接字概念：**

Socket 中文意思是“插座”，在 Linux 环境下，用于表示进程 x 间网络通信的特殊文件类型。本质为内核借助缓冲区形成的伪文件。

既然是文件，那么理所当然的，我们可以使用文件描述符引用套接字。Linux 系统将其封装成文件的目的是为了统一接口，使得读写套接字和读写文件的操作一致。区别是文件主要应用于本地持久化数据的读写，而套接字多应用于网络进程间数据的传递。

在 TCP/IP 协议中，“IP 地址+TCP 或 UDP 端口号”唯一标识网络通讯中的一个进程。“IP 地址+端口号”就对应一个 socket。欲建立连接的两个进程各自有一个 socket 来标识，那么这两个 socket 组成的 socket pair 就唯一标识一个连接。因此可以用 Socket 来描述网络连接的一对一关系。

**套接字通信原理如下图所示：**

![](assets/212a81f6151ae5f75246e6422fcd0cf6.png)

在网络通信中，套接字一定是成对出现的。一端的发送缓冲区对应对端的接收缓冲区。



## （三）知识点精炼

### 1.socket地址API

#### （1）主机字节序和网络字节序

```cpp
#include<netinet/in.h>

unsigned long int htonl(unsigned long int hostlong);
unsigned short int htons(unsigned short int hostshort);
unsigned long int ntohl(unsigned long int netlong);
unsigned short int ntohs(unsigned short int netshort);
```

- 现代PC大多采用小端字节序，因此**小端字节序又被称为主机字节序** 。

  当格式化的数据（比如32 bit整型数和16 bit短整型数）在两台使用不同字节序的主机之间直接传递时，接收端必然错误地解释之。解决问题的方法是：发送端总是把要发送的数据转化成大端字节序数据后再发送，而接收端知道对方传送过来的数据总是采用大端字节序，所以接收端可以根据自身采用的字节序决定是否对接收到的数据进行转换（小端机转换，大端机不转换）。因此**大端字节序也称为网络字节序** ，它给所有接收数据的主机提供了一个正确解释收到的格式化数据的保证。

  > 判断机器字节序
  >
  > ```cpp
  > #include <stdio.h>
  > 
  > void byteorder()
  > {
  >  union
  >  {
  >      short value;
  >      char union_bytes[sizeof(short)];
  >  }test;
  > 
  >  test.value=0x0102;
  >  if((test.union_bytes[0]==1)&&(test.union_bytes[1]==2))
  >  {
  >  	printf("big endian\n");
  >  }
  >  else if((test.union_bytes[0]==2)&&(test.union_bytes[1]==1))
  >  {
  >  	printf("little endian\n");
  >  }
  >  else
  >  {
  >  	printf("unknown...\n");
  >  }
  > }
  > ```

- 即使是同一台机器上的两个进程（比如一个由C语言编写，另一个由JAVA编写）通信，也要考虑字节序的问题（JAVA虚拟机采用大端字节序）。

- htonl表示“host to network long”，即将长整型（32 bit）的主机字节序数据转化为网络字节序数据。l 表示 32 位长整数，s 表示 16 位短整数。端口号是16位的，ip地址是32位的，所以长整型函数通常用来转换IP地址，短整型函数用来转换端口号（当然不限于此。任何格式化的数据通过网络传输时，都应该使用这些函数来转换字节序）。

#### （2）通用socket地址

```cpp
#include<bits/socket.h>

struct sockaddr
{
    sa_family_t sa_family;  //地址族类型（sa_family_t）的变量
    char sa_data[14];  //存放socket地址值
}
```

![](assets/cec31c54ce5865251821ded738d251f4.png)

- 地址族类型通常与协议族类型对应，且后者与前者有完全相同的值，所以二者通常混用。

  协议族：protocol family  地址族：address family

![](assets/8add3f153fddd7dfda2423ea8609b344.png)

- 由于不同的协议族的地址值具有不同的含义和长度，14字节的sa_data根本无法完全容纳多数协议族的地址值。因此，Linux定义了下面这个新的通用socket地址结构体：

```cpp
#include <bits/socket.h>

struct sockaddr_storage
{
    sa_family_t sa_family;
    unsigned long int__ss_align;
    char__ss_padding[128-sizeof(__ss_align)];  //由于内存对齐
}
```

#### （3）专用socket地址

由于通用socket地址结构体很不好用，比如设置与获取IP地址和端口号就需要执行烦琐的位操作。所以Linux为各个协议族提供了专门的socket地址结构体。

* **UNIX本地域协议族专用socket地址结构体：**

```cpp
#include <sys/un.h>
struct sockaddr_un
{
    sa_family_t sin_family;/*  地址族：AF_UNIX*  /
    char sun_path[108];/*  文件路径名*  /
};
```

* **TCP/IP协议族有sockaddr_in和sockaddr_in6两个专用socket地址结构体，它们分别用于IPv4和IPv6：**

```cpp
//IPv4
struct sockaddr_in
{
    sa_family_t sin_family;/*地址族：AF_INET*/
    u_int16_t sin_port;/*端口号，要用网络字节序表示*/
    struct in_addr sin_addr;/*IPv4地址结构体，见下面*/
};
struct in_addr
{
    u_int32_t s_addr;/*IPv4地址，要用网络字节序表示*/
};

//IPv6
struct sockaddr_in6
{
    sa_family_t sin6_family;/*地址族：AF_INET6*/
    u_int16_t sin6_port;/*端口号，要用网络字节序表示*/
    u_int32_t sin6_flowinfo;/*流信息，应设置为0*/
    struct in6_addr sin6_addr;/*IPv6地址结构体，见下面*/
    u_int32_t sin6_scope_id;/*scope ID，尚处于实验阶段*/
};
struct in6_addr
{
	unsigned char sa_addr[16];/*IPv6地址，要用网络字节序表示*/
};
```

- 所有专用socket地址（以及sockaddr_storage）类型的变量在实际使用时都需要转化为通用socket地址类型sockaddr（强制转换即可），因为所有socket编程接口使用的地址参数的类型都是sockaddr。
- 地址和端口号都要用网络字节序表示，地址还要是网络字节序整数
- server_addr.sin_addr 可以取 INADDR_ANY，INADDR_ANY为0表示本机所有的ip地址，就是0.0.0.0，因为有多个网卡，大小端都是0

![](assets/71088d80f7d86709346f872280d6bfd4.png)

#### （4）IP地址转换函数

##### ①第一组：适用IPv4

点分十进制字符串表示的IPv4地址或者十六进制字符串表示的IPv6地址在网络中要转成整数（二进制数）才能使用，而从网络上拿下来自己使用，比如记录日志时，则要把整数表示的IP地址转化为可读的字符串：

```cpp
#include <arpa/inet.h>

//点分十进制字符串表示的IPv4地址转化为用网络字节序整数表示的IPv4地址,失败返回INADDR_NONE:
in_addr_t inet_addr(const char*   strptr); 

//与inet_addr一样，但是将转化结果存储于参数inp指向的地址结构中。它成功时返回1，失败则返回0。
int inet_aton(const char*   cp,struct in_addr*   inp);

//与inet_addr相反，将网络字节序整数表示的IPv4地址转化为用点分十进制字符串表示的IPv4地址
char*   inet_ntoa(struct in_addr in);
```

- 第一个作用：字符串和二进制数直接的转换；第二个作用：主机字节序和网络字节序的转换，所以不需要在调用htonl或者ntohl

- a表示ASCII，n表示numeric数值，inet表示internet

- inet_ntoa函数内部用一个静态变量存储转化结果，函数的返回值指向该静态内存，因此inet_ntoa是不可重入的：

  ```cpp
  char*   szValue1 = inet_ntoa("1.2.3.4");
  char*   szValue2 = inet_ntoa("10.194.71.60");
  printf("address 1:%s\n",szValue1);
  printf("address 2:%s\n",szValue2);
  
  //结果：
  address1:10.194.71.60
  address2:10.194.71.60
  ```

- 用的地址都是单独的struct sockaddr_in里的struct in_addr变量

##### ①第二组：适用IPv4和IPv6

```cpp
#include <arpa/inet.h>

int inet_pton(int af,const char*   src,void*   dst);
const char*   inet_ntop(int af,const void*   src,char*   dst,socklen_t cnt);
```

1. inet_pton：

   - 将用字符串表示的IP地址src（用点分十进制字符串表示的IPv4地址或用十六进制字符串表示的IPv6地址）转换成用网络字节序整数表示的IP地址
   - 转换结果存储于dst指向的内存中
   - af是地址族，可以是AF_INET或者AF_INET6。
   - inet_pton成功时返回1，失败则返回0并设置errno[1]。

2. inet_ntop：

   - 进行相反的转换，前三个参数的含义与inet_pton的参数相同，最后一个参数cnt指定目标存储单元的大小。

   - 最后一个参数cnt指定目标存储单元的大小。下面的两个宏能帮助我们指定这个大小（分别用于IPv4和IPv6）：

     ```cpp
     #include <netinet/in.h>
     #define INET_ADDRSTRLEN 16
     #define INET6_ADDRSTRLEN 46
     ```

   - 成功时返回目标存储单元的地址，失败则返回NULL并设置errno。

   3.p是presentation表达式，n表示numeric数值

   

### 2.从创建socket到数据的读写

#### （1）创建socket

```cpp
#include <sys/types.h>
#include <sys/socket.h>
int socket(int domain,int type,int protocol);
```

- domain：协议族，TCP/IP协议族用PF_INET（Protocol Family of Internet，用于IPv4）或PF_INET6（用于IPv6），NIX本地域协议族用PF_UNIX

- type：指定服务类型。服务类型主要有SOCK_STREAM服务（流服务）和SOCK_UGRAM（数据报）服务。对TCP/IP协议族而言，其值取SOCK_STREAM表示传输层使用TCP协议，取SOCK_DGRAM表示传输层使用UDP协议。

  > 自Linux内核版本2.6.17起，type参数可以接受上述服务类型与下面两个重要的标志相与的值：SOCK_NONBLOCK和SOCK_CLOEXEC。
  >
  > 分别表示将新创建的socket设为非阻塞的，以及用fork调用创建子进程时在子进程中关闭该socket。在内核版本2.6.17之前的Linux中，文件描述符的这两个属性都需要使用额外的系统调用（比如fcntl）来设置。
  >
  > 
  >
  > 其他还有：
  > SOCK_SEQPACKET 该协议是双线路的、可靠的连接，发送固定长度的数据包进行传输。必须把这个包完整的接受才能进行读取。
  > SOCK_RAW 类型提供单一的网络访问，这个 socket 类型使用 ICMP 公共协议。（ping、traceroute 使用该协议）
  > SOCK_RDM 这个类型是很少使用的，在大部分的操作系统上没有实现，它是提供给数据链路层使用，不保证数据包的顺序
  >
  > ..........

- protocol：在前两个参数构成的协议集合下，再选择一个具体的协议，不过这个值通常都是唯一的（前两个参数已经完全决定了它的值）。几乎在所有情况下，我们都应该把它设置为0，表示使用默认协议。

- socket系统调用成功时返回一个socket文件描述符，失败则返回-1并设置errno。



#### （2）命名socket

```cpp
#include <sys/types.h>
#include <sys/socket.h>
int bind(int sockfd,const struct sockaddr*   my_addr,socklen_t addrlen);
```

- 作用：将一个socket与socket地址绑定称为给socket命名

  在服务器程序中，我们通常要命名socket，因为只有命名后客户端才能知道该如何连接它。客户端则通常不需要命名socket，而是采用匿名方式，即使用操作系统自动分配的socket地址。

- socked：创建socket时返回的socket文件描述符

- my_addr：socket地址，我们一般使用的都是sockaddr_in，如前所述所有socket编程接口使用的地址参数的类型都是sockaddr，需要强制转换

- addrlen：该socket地址的长度

- bind成功时返回0，失败则返回-1并设置errno

  > - EACCES，被绑定的地址是受保护的地址，仅超级用户能够访问。比如普通用户将socket绑定到知名服务端口（端口号为0～1023）上时，bind将返回EACCES错误。
  > - EADDRINUSE，被绑定的地址正在使用中。比如将socket绑定到一个处于TIME_WAIT状态的socket地址。

#### （3）服务器端监听socket

```cpp
#include <sys/socket.h>
int listen(int sockfd,int backlog);
```

- socket被命名之后，还不能马上接受客户连接，我们需要使用listen系统调用来创建一个监听队列以存放待处理的客户连接

- sockfd为监听的socket文件描述符，backlog指定内核监听队列最大长度，注意：最终处于完整的连接（ESTABLISHED状态）最多有（backlog+1）个，在不同的系统上会有些差别，不过监听队列中完整连接的上限通常比backlog值略大。

  > 监听队列的长度如果超过backlog，服务器将不受理新的客户连接，客户端也将收到ECONNREFUSED错误信息
  >
  > 在内核版本2.2之前的Linux中，backlog参数是指所有处于半连接状态（SYN_RCVD）和完全连接状态（ESTABLISHED）的socket的上限。但自内核版本2.2之后，它只表示处于完全连接状态的socket的上限，处于半连接状态的socket的上限则由/proc/sys/net/ipv4/tcp_max_syn_backlog内核参数定义。backlog参数的典型值是5。
  >
  > 
  >
  > 查看系统默认 backlog
  >
  > ```shell
  > cat /proc/sys/net/ipv4/tcp_max_syn_backlog
  > ```
  >
  > 改变 系统限制的 backlog 大小
  >
  > ```shell
  > vim /etc/sysctl.conf
  > 
  > 最后添加
  > net.core.somaxconn = 1024
  > net.ipv4.tcp_max_syn_backlog = 1024
  > 
  > 保存，然后执行
  > sysctl -p
  > ```

- listen成功时返回0，失败则返回-1并设置errno。

#### （4）服务器端接受连接

```cpp
#include <sys/types.h>
#include <sys/socket.h>
int accept(int sockfd,struct sockaddr*  addr,socklen_t*  addrlen);
```

- sockfd：执行过listen系统调用的监听socket

- addr：用来获取被接受连接的远端socket地址，是个传出参数

- addrlen：指明addr长度

- accept成功时返回一个新的连接socket，该socket唯一地标识了被接受的这个连接，服务器可通过读写该socket来与被接受连接对应的客户端通信。accept失败时返回-1并设置errno。

- 注意：ccept只是从监听队列中取出连接，而不论连接处于何种状态（如ESTABLISHED状态和CLOSE_WAIT状态），更不关心任何网络状况的变化。

  > 我们把执行过listen调用、处于LISTEN状态的socket称为监听socket，而所有处于ESTABLISHED状态的socket则称为连接socket。

#### （5）客户端发起连接

```cpp
#include <sys/types.h>
#include <sys/socket.h>
int connect(int sockfd,const struct sockaddr* serv_addr,socklen_t addrlen);
```

- sockfd：创建一个socket返回的文件名描述符

- serv_addr：要连接的服务器所监听的socket地址

- addrlen：指定地址长度

- connect成功时返回0。一旦成功建立连接，sockfd就唯一地标识了这个连接，客户端就可以通过读写sockfd来与服务器通信。connect失败则返回-1并设置errno。

  > 两种常见的errno是ECONNREFUSED和ETIMEDOUT，它们的含义如下：
  >
  > - ECONNREFUSED，目标端口不存在，连接被拒绝。
  > - ETIMEDOUT，连接超时。

#### （6）关闭连接

```cpp
#include <unistd.h>
int close(int fd);
```

- fd：待关闭的socket

- 注意：close系统调用并非总是立即关闭一个连接，而是将fd的引用计数减1。只有当fd的引用计数为0时，才真正关闭连接

  > 多进程程序中，一次fork系统调用默认将使父进程中打开的socket的引用计数加1，因此我们必须在父进程和子进程中都对该socket执行close调用才能将连接关闭。
  >
  > 
  >
  > shutdown系统调用：无论如何都要立即终止连接（而不是将socket的引用计数减1）：
  >
  > ```cpp
  > #include <sys/socket.h>
  > int shutdown(int sockfd,int howto);
  > ```
  >
  > - howto参数决定了shutdown的行为：
  >
  >   ![](assets/049c3c1cdee2955fa3d93d4e11280f4e.png)
  >
  > - shutdown能够分别关闭socket上的读或写，或者都关闭。而close在关闭连接时只能将socket上的读和写同时关闭。
  >
  > - shutdown成功时返回0，失败则返回-1并设置errno。

#### （7）数据读写

对文件的读写操作read和write同样适用于socket。但是socket编程接口提供了几个专门用于socket数据读写的系统调用，它们增加了对数据读写的控制

##### ①TCP数据读写

```cpp
#include <sys/types.h>
#include <sys/socket.h>
ssize_t recv(int sockfd,void*  buf,size_t len,int flags);
ssize_t send(int sockfd,const void*  buf,size_t len,int flags);
```

- buf和len参数分别指定缓冲区的位置和大小
- recv成功时返回实际读取到的数据的长度，它可能小于我们期望的长度len。因此我们可能要多次调用recv，才能读取到完整的数据。recv可能返回0，这意味着通信对方已经关闭连接了。recv出错时返回-1并设置errno。
- send成功时返回实际写入的数据的长度，失败则返回-1并设置errno。

> 返回0，对方关闭连接
>
> 返回-1：(errno == EAGAIN) || (errno == EWOULDBLOCK) 数据未准备好

##### ②UDP数据读写

```cpp
#include <sys/types.h>
#include <sys/socket.h>
ssize_t recvfrom(int sockfd,void*  buf,size_t len,int flags,struct sockaddr*  src_addr,socklen_t*  addrlen);
ssize_t sendto(int sockfd,const void*  buf,size_t len,int flags,const struct sockaddr*  dest_addr,socklen_t addrlen);
```

- 同样，buf和len参数分别指定缓冲区的位置和大小
- 因为UDP通信没有连接的概念，所以我们每次读取（发送）数据都需要获取发送端（接收端）的socket地址，即参数src_addr（dest_addr）所指的内容，addrlen参数则指定该地址的长度。
- recvfrom/sendto系统调用也可以用于面向连接（STREAM）的socket的数据读写，只需要把最后两个参数都设置为NULL以忽略发送端/接收端的socket地址（因为我们已经和对方建立了连接，所以已经知道其socket地址了）。

> UDP相比TCP，无需在连接状态下交换数据，因此UDP的server端和client端无需经过连接过程，即不必调用listen()和accept()函数以及connect()函数。UDP中只有创建套接字和数据交换的过程。

##### ③通用数据读写函数

```cpp
#include <sys/socket.h>
ssize_t recvmsg(int sockfd,struct msghdr* msg,int flags);
ssize_t sendmsg(int sockfd,struct msghdr* msg,int flags);
```

通用数据读写函数与前两者主要就是传递的数据结构的区别，struct msghdr结构体：

```cpp
struct msghdr
{
    /*socket地址，对于面向连接的TCP协议，该成员没有意义，必须被设置为NULL。这是因为对数据流socket而言，对方的地址已经知道*/
    void* msg_name;
    socklen_t msg_namelen;           /*socket地址的长度*/
    struct iovec* msg_iov;            /*分散的内存块，见后文*/
    int msg_iovlen;                  /*分散内存块的数量*/
    void* msg_control;                /*指向辅助数据的起始位置*/
    socklen_t msg_controllen;        /*辅助数据的大小*/
    int msg_flags;                   /*复制函数中的flags参数，并在调用过程中更新*/
};
```

结构成员能够分为四组。他们是：

- **socket 地址成员：**msg_name与msg_namelen：

  `msg_name`是指向`socket`地址的指针，`msg_namelen`是`socket`地址的长度，一般用在无连接的套接字，有连接的套接字指定为NULL和0即可。

  对于`recvmsg`函数，他们是传出参数，会返回发送方的 socket 地址。

  `msg_name` 定义为`void *`类型，因此并不需要将其显式转换为 `struct sockaddr *` 

- **待发送的分散数据块：**`msg_iov` 和 `msg_iovlen`

  struct iovec结构体：

  ```cpp
  struct iovec
  {
      void* iov_base;/*内存起始地址*/
      size_t iov_len;/*这块内存的长度*/
  };
  ```

  由上可见，iovec结构体封装了一块内存的起始位置和长度。msg_iovlen指定这样的iovec结构对象有多少个。对于recvmsg而言，数据将被读取并存放在msg_iovlen块分散的内存中，这些内存的位置和长度则由msg_iov指向的数组指定，这称为**分散读（scatter read）**；对于sendmsg而言，msg_iovlen块分散内存中的数据将被一并发送，这称为**集中写（gather write）** 。

- **辅助(或附属)数据：**`msg_control` 和 `msg_controllen`

  `msg_control`指向辅助数据起始地址，`msg_controllen`指明辅助数据的长度，可以用他们来实现在进程间传递文件描述符。`msg_control`的类型是`struct cmsghdr*`，其定义如下：

  ```cpp
  struct cmsghdr {
      socklen_t cmsg_len;     // 辅助数据的总长度，由 CMSG_LEN 宏直接获取
      int       cmsg_level;   // 表示通道使用的的原始协议级别，与 setsockopt 函数的 level 参数相同
      int       cmsg_type;    // 控制信息类型，例如，SCM_RIGHTS，辅助数据是文件描述符；SCM_CREDENTIALS，辅助数据是一个包含证书信息的结构
      /* u_char     cmsg_data[];  这个成员并不实际存在。他用来指明实际的额外附属数据所在的位置。*/
  };
  ```

  辅助数据分三部分，分别是 `cmsghdr`结构体(又称头部) 、填充(对齐)字节 和 数据部分（数据部分后面可能还有填充字节，这是为了对齐），在内存中也是按此顺序排布。虽说这部分共称辅助数据，但其实真正的辅助数据只有后面的数据部分。

  ![在这里插入图片描述](https://img-blog.csdnimg.cn/162c98ac6b324afb9489d15e7eb0be7a.png)

  注意，辅助数据不止一段。每段辅助数据都由`cmsghdr`结构体开始，每个`cmsghdr`结构体只记录自己这一段辅助数据的大小。所以最终整个辅助数据大小还需要进行求和（求和方法马上讲）。

  在实际使用时，需要我们填充的是`cmsghdr`结构体 和 数据部分。Linux为我们提供了如下宏来填充他们：

  ```cpp
  #include <sys/socket.h>
  #include <sys/param.h>
  #include <sys/socket.h>
  size_t CMSG_LEN(size_t length);
  void* CMSG_DATA(struct cmsghdr *cmsg);
  struct cmsghdr *CMSG_FIRSTHDR(struct msghdr *msgh);
  struct cmsghdr *CMSG_NXTHDR(struct msghdr *msgh, struct cmsghdr *cmsg);
  size_t CMSG_SPACE(size_t length);
  size_t CMSG_ALIGN(size_t length);
  ```

  **CMSG_LEN() 宏：**

  传入参数：只需传入数据（第三）部分对象的大小。
  返回值：系统自动计算整个辅助数据的大小（不包结尾的填充字节）并返回。
  用途：直接把该宏赋值给`msghdr`的`cmsg_len`成员。

  **CMSG_DATA() 宏：**

  传入参数：指向`cmsghdr`结构体的指针。
  返回值：返回跟随在头部以及填充字节之后的辅助数据的第一个字节（如果存在，对于`recv`）的地址。
  用途：设置我们要传递的数据。例如要传递文件描述符时，代码如下

  ```cpp
  struct cmsgptr* cmptr;  
  int fd = *(int*)CMSG_DATA(cmptr); 	// 发送：*(int *)CMSG_DATA(cmptr) = fd;  
  ```

  **CMSG_FIRSTHDR() 宏：**

  输入参数：指向`msghdr`结构体的指针。
  返回值：指向整个辅助数据中的第一段辅助数据的 `struct cmsghdr` 指针。如果不存在辅助数据则返回`NULL`

  **CMSG_NXTHDR() 宏：**

  输入参数：指向`msghdr`结构体的指针，和指向当前`cmsghdr`结构体的指针。
  返回值：返回下一段辅助数据的 `struct cmsghdr` 指针，若没有下一段则返回`NULL`。
  用途：遍历所有段的辅助数据，代码如下：

  ```cpp
  struct msghdr msgh;		
  struct cmsghdr *cmsg;  
  for (cmsg = CMSG_FIRSTHDR(&msgh); cmsg != NULL; cmsg = CMSG_NXTHDR(&msgh,cmsg) 
  {  
      得到了当前段的 cmmsg，就能通过CMSG_DATA()宏取得辅助数据了
  }
  ```

  **CMSG_SPACE() 宏：**

  输入参数：只需传入数据（第三）部分对象的大小。
  返回值：计算每一段辅助数据的大小，包括结尾（两段辅助数据之间）的填充字节，注意，`CMSG_LEN()`并不包括结尾的填充字节。
  用途：计算整个辅助数据所需的总大小。如果有多段辅助数据，要使用多个`CMSG_SPACE()`宏计算所有段辅助数据所需的总内存空间。

  ```cpp
  CMSG_LEN() 和 CMSG_SPACE()的区别：
  printf("CMSG_LEN(sizeof(short))=%d/n", CMSG_LEN(sizeof(short))); 		返回14
  printf("CMSG_SPACE(sizeof(short))=%d/n", CMSG_SPACE(sizeof(short))); 	返回16，说明这段辅助数据最后还有2字节的填充字节
  ```

  **CMSG_ALIGN()宏：**

  这是一个Linux扩展宏，而不是Posix.1g标准的一部分。指定一个字节长度作为输入，这个宏会计算一个新的长度，这个新长度包括为了维护对齐所需要的额外的填充字节。用的不多，先不管他。

  

  综上，文件描述符是通过`msghdr`的 辅助数据的数据部分发送的。了解了`msghdr` 和 `cmsghdr`两个结构体我们就可以使用`sendmsg` 和 `recvmsg`函数发送文件描述符了。





##### ④三个读写函数中读写的flag参数

flags通常设置为0即可，可以取表中的一个或几个的逻辑或：

![](assets/a7970100c21d10063949d9e3fc781669.png)

注意：flags参数只对send和recv的当前调用生效，而后面我们将看到如何通过setsockopt系统调用永久性地修改socket的某些属性。

**MSG_OOB：** 

1. 对于紧急数据我们可以在send中设置MSG_OOB标志，对于在recv中也设置MSG_OOB，需要注意的是：服务器对正常数据的接收将被带外数据截断（见p.85)

2. 但在实际应用中，我们通常无法预期带外数据何时到来。好在Linux内核检测到TCP紧急标志时，将通知应用程序有带外数据需要接收。内核通知应用程序带外数据到达的两种常见方式是：**I/O复用产生的异常事件** 和 **SIGURG信号** ；

   但是，即使应用程序得到了有带外数据需要接收的通知，还需要知道带外数据在数据流中的具体位置，才能准确接收带外数据。这一点可通过如下系统调用实现：

   ```cpp
   #include <sys/socket.h>
   int sockatmark(int sockfd);
   ```

   sockatmark判断sockfd是否处于带外标记，即下一个被读取到的数据是否是带外数据。如果是，sockatmark返回1，此时我们就可以利用带MSG_OOB标志的recv调用来接收带外数据。如果不是，则sockatmark返回0。

#### （8）小结

1. 只有创建socket和数据读写部分需要额外建议一些标志：

   - 创建socket：SOCK_STREAM服务（流服务）和SOCK_UGRAM（数据报）服务，SOCK_NONBLOCK将新创建的socket设为非阻塞的和SOCK_CLOEXEC用fork调用创建子进程时在子进程中关闭该socket。
   - 数据读写部分：如上图

2. 除了创建socket和服务器接收一个连接分别是返回一个socket文件描述符和返回一个唯一标识此连接的文件描述符并且失败时都返回-1并设置errno。其它都是成功返回0，失败返回-1并设置errno

   数据读写函数则是，读函数返回实际读到的数据的长度，写函数返回实际写入的数据的长度，可能返回0，表示对方关闭了连接，失败都返回-1并设置errno。

3. 记忆：关于接受的，接受连接和接收数据，关于地址长度的参数都是指针，因为要记录长度，注意要传地址，包括下面的获取socket地址信息函数和getsockopt函数

   

   

   

   

### 3.其它网络相关API

#### （1）获取网络信息相关API

##### ①获取socket地址信息函数

```cpp
#include <sys/socket.h>
int getsockname(int sockfd,struct sockaddr* address,socklen_t* address_len); //获取sockfd对应的本端socket地址
int getpeername(int sockfd,struct sockaddr* address,socklen_t* address_len); //获取sockfd对应的远端socket地址
```

- 注意：获取的地址存储于address参数指定的内存中，该socket地址的长度则存储于address_len参数指向的变量中。如果实际socket地址的长度大于address所指内存区的大小，那么该socket地址将被截断。
- 同样getsockname成功时返回0，失败返回-1并设置errno。

##### ②获取主机完整信息

> 可以用主机名来访问一台机器，而避免直接使用其IP地址。用服务名称来代替端口号。比如，下面两条telnet命令具有完全相同的作用：
>
> ```cpp
> telnet 127.0.0.1 80
> telnet localhost www
> ```
>
> telnet客户端程序是通过调用某些网络信息API来实现主机名到IP地址的转换，以及服务名称到端口号的转换的。

```cpp
#include <netdb.h>
struct hostent* gethostbyname(const char* name); //根据主机名称获取主机的完整信息
struct hostent* gethostbyaddr(const void* addr,size_t len,int type); //根据IP地址获取主机的完整信息
```

- hostent结构体的定义如下：

  ```cpp
  #include＜netdb.h＞
  struct hostent
  {
      char*h_name;		/*主机名*/
      char**h_aliases;	/*主机别名列表，可能有多个*/
      int h_addrtype;		/*地址类型（地址族）*/
      int h_length;		/*地址长度*/
      char**h_addr_list	/*按网络字节序列出的主机IP地址列表*/
  };
  ```

- name参数指定目标主机的主机名，addr参数指定目标主机的IP地址，len参数指定addr所指IP地址的长度，type参数指定addr所指IP地址的类型，其合法取值包括AF_INET（用于IPv4地址）和AF_INET6（用于IPv6地址）。

- gethostbyname函数通常先在本地的/etc/hosts配置文件中查找主机，如果没有找到，再去访问DNS服务器。

##### ③获取某个服务的完整信息

```cpp
#include＜netdb.h＞
struct servent* getservbyname(const char*name,const char*proto); //根据名称获取某个服务的完整信息
struct servent* getservbyport(int port,const char*proto);   //根据端口号获取某个服务的完整信息
```

- servent结构体：

  ```cpp
  #include＜netdb.h＞
  struct servent
  {
      char*s_name;/*服务名称*/
      char**s_aliases;/*服务的别名列表，可能有多个*/
      int s_port;/*端口号*/
      char*s_proto;/*服务类型,通常是tcp或者udp*/
  };
  ```

- name参数指定目标服务的名字，port参数指定目标服务对应的端口号。proto参数指定服务类型，给它传递“tcp”表示获取流服务，给它传递“udp”表示获取数据报服务，给它传递NULL则表示获取所有类型的服务。

- 它们实际上都是通过读取/etc/services文件来获取服务的信息的。



##### ④同时获得ip地址和端口号

通过主机名获得IP地址（内部使用的是gethostbyname函数），通过服务名获得端口号（内部使用的是getservbyname函数）

```cpp
#include＜netdb.h＞
int getaddrinfo(const char*hostname,const char*service,const struct addrinfo*hints,struct addrinfo**result);
```

- hostname：可以接收主机名，也可以接收字符串表示的IP地址（IPv4采用点分十进制字符串，IPv6则采用十六进制字符串）

- service：可以接收服务名，也可以接收字符串表示的十进制端口号

- result：指向一个链表，该链表用于存储getaddrinfo反馈的结果，getaddrinfo反馈的每一条结果都是addrinfo结构体类型的对象，

- hints：应用程序给getaddrinfo的一个提示，以对getaddrinfo的输出进行更精确的控制。hints参数可以被设置为NULL，表示允许getaddrinfo反馈任何可用的结果

  struct addrinfo结构体：

  ```cpp
  struct addrinfo
  {
      int ai_flags;/*见后文*/
      int ai_family;/*地址族*/
      int ai_socktype;/*服务类型，SOCK_STREAM或SOCK_DGRAM*/
      int ai_protocol;/*具体的网络协议，其含义和socket系统调用的第三个参数相同，它通常被设置为0*/
      socklen_t ai_addrlen;/*socket地址ai_addr的长度*/
      char*ai_canonname;/*主机的别名*/
      struct sockaddr*ai_addr;/*指向socket地址*/
      struct addrinfo*ai_next;/*指向下一个sockinfo结构的对象*/
  };
  ```

  ai_flags可以取表5-6中的标志的按位或：

  ![](assets/234915afc357742012adecc89ea24ed1.png)

  > 注意：当我们使用hints参数的时候，可以设置其ai_flags，ai_family，ai_socktype和ai_protocol四个字段，其他字段则必须被设置为NULL。
  >
  > 例如：利用hints参数获取主机ernest-laptop上的“daytime”流服务信息：
  >
  > ```cpp
  > struct addrinfo hints
  > struct addrinfo* res;
  > bzero(&hints,sizeof(hints));
  > hints.ai_socktype=SOCK_STREAM;
  > getaddrinfo("ernest-laptop","daytime",&hints,&res);
  > ```
  >
  > **getaddrinfo将隐式地分配堆内存（可以通过valgrind等工具查看），因为res指针原本是没有指向一块合法内存的，所以，getaddrinfo调用结束后，我们必须使用如下配对函数来释放这块内存：**
  >
  > ```cpp
  > #include＜netdb.h＞
  > void freeaddrinfo(struct addrinfo*res);
  > ```

  

##### ⑤同时获得主机名和服务名

通过socket地址同时获得以字符串表示的主机名（内部使用的是gethostbyaddr函数）和服务名（内部使用的是getservbyport函数）。

```cpp
#include＜netdb.h＞
int getnameinfo(const struct sockaddr* sockaddr,socklen_t addrlen,char* host,socklen_t hostlen,char* serv,socklen_t servlen,int flags);
```

- 将返回的主机名存储在host参数指向的缓存中，将服务名存储在serv参数指向的缓存中

- flags参数控制getnameinfo的行为，同样可以取表5-7中的选项的按位或：

  ![](assets/1ef1f496b486d6fe26e40739aad843cd.png)

  

> 注意：②和③中的4个函数都是不可重入的，即非线程安全的。不过netdb.h头文件给出了它们的可重入版本。正如Linux下所有其他函数的可重入版本的命名规则那样，这些函数的函数名是在原函数名尾部加上_r（re-entrant）。
>
> ④和⑤是否可重入取决于其内部调用的对应函数是否是它们的可重入版本
>
> getaddrinfo和getnameinfo函数成功时返回0，失败则返回错误码，可能的错误码如表5-8所示。
>
> ![](assets/39b613fb851cd582eeea4753d3f9c05a.png)





#### （2）设置socket文件描述符属性专用函数

> fcntl系统调用是控制文件描述符属性的通用POSIX方法，getsockopt和setsockopt是专门用来读取和设置socket文件描述符属性的方法

```cpp
#include＜sys/socket.h＞
int getsockopt(int sockfd,int level,int option_name,void* option_value,socklen_t* restrict option_len);
int setsockopt(int sockfd,int level,int option_name,const void* option_value,socklen_t option_len);
```

- sockfd参数指定被操作的目标socket。
- level参数指定要操作哪个协议的选项（即属性），比如IPv4、IPv6、TCP等，
- option_name参数则指定选项的名字
- option_value和option_len参数分别是被操作选项的值和长度。不同的选项具有不同类型的值
- getsockopt和setsockopt这两个函数成功时返回0，失败时返回-1并设置errno。

![](assets/d642966a882db5c1b75615114c3fc289.png)

> 注意：
>
> socket选项包括：SO_DEBUG、SO_DONTROUTE、SO_KEEPALIVE、SO_LINGER、SO_OOBINLINE、SO_RCVBUF、SO_RCVLOWAT、SO_SNDBUF、SO_SNDLOWAT、TCP_MAXSEG和TCP_NODELAY。
>
> - 对服务器而言，这部分socket选项只能在调用listen系统调用前针对监听socket设置才有效
>
>   这是因为连接socket只能由accept调用返回，而accept从listen监听队列中接受的连接至少已经完成了TCP三次握手的前两个步骤（因为listen监听队列中的连接至少已进入SYN_RCVD状态），这说明服务器已经往被接受连接上发送出了TCP同步报文段。但有的socket选项却应该在TCP同步报文段中设置，比如TCP最大报文段选项。
>
>   对这种情况，Linux给开发人员提供的解决方案是：对监听socket设置这些socket选项，那么accept返回的连接socket将自动继承这些选项。
>
> - 而对客户端而言，这些socket选项则应该在调用connect函数之前设置，因为connect调用成功返回之后，TCP三次握手已完成。

**部分重要的socket选项（p89~p94)：**

- SO_REUSEADDR选项：

服务器程序可以通过设置socket选项SO_REUSEADDR来强制使用被处于TIME_WAIT状态的连接占用的socket地址。

- SO_RCVBUF和SO_SNDBUF选项：

SO_RCVBUF和SO_SNDBUF选项分别表示TCP接收缓冲区和发送缓冲区的大小。不过，当我们用setsockopt来设置TCP的接收缓冲区和发送缓冲区的大小时，系统都会将其值加倍，并且不得小于某个最小值。

- SO_RCVLOWAT和SO_SNDLOWAT选项

SO_RCVLOWAT和SO_SNDLOWAT选项分别表示TCP接收缓冲区和发送缓冲区的低水位标记。它们一般被I/O复用系统调用（见第9章）用来判断socket是否可读或可写。当TCP接收缓冲区中可读数据的总数大于其低水位标记时，I/O复用系统调用将通知应用程序可以从对应的socket上读取数据；当TCP发送缓冲区中的空闲空间（可以写入数据的空间）大于其低水位标记时，I/O复用系统调用将通知应用程序可以往对应的socke上写入数据。

默认情况下，TCP接收缓冲区的低水位标记和TCP发送缓冲区的低水位标记均为1字节。

- SO_LINGER选项

SO_LINGER选项用于控制close系统调用在关闭TCP连接时的行为。默认情况下，当我们使用close系统调用来关闭一个socket时，close将立即返回，TCP模块负责把该socket对应的TCP发送缓冲区中残留的数据发送给对方。

```cpp
struct linger
{
    int l_onoff;    /*0=off,nonzero = on */
    int l_linger;    /*linger time,Posix.1g specifies units as seconds */
};

setsockopt(fd,SOL_SOCKET,SO_LINGER,(void *)&st_linger,&sizeof(st_linger));
```

1. `l_onoff=0;l_linger`忽略
   `close`立即返回，底层会将未发送完的数据发送完后再释放资源，即`优雅的退出`。
2. `l_onoff !=0;l_linger = 0`
   `close()`立刻返回，但不会发送未发送完的数据，而是通过`REST`包强制关闭`socket`描述符，即`强制退出`
3. `l_onoff !=0;l_linger > 0`
   `close`不会立刻返回，内核会延时一段时间，这个时间就由`l_linger`的值来决定。如果超时时间到达之前，发送完未发送的数据（包括`FIN`包）并得到另一端的确认，`close()`会返回正确，`socket`描述符`优雅性`退出。否则，`close()`会直接返回错误值，未发送数据丢失，`socket`描述符被强制性退出。需要注意的是，如果socket描述符被设置未非阻塞型，则`close()`会直接返回值。

#### （3）出错处理函数

**方法一：strerror和perror**

```cpp
#include <errno.h>
#include <string.h>
char *  strerror(int errnum); /*See NOTES */

errnum:
	传入参数,错误编号的值，一般取 errno 的值
返回值：
	错误原因字符串形式
	
	
#include <stdio.h>
#include <errno.h>
void perror(const char *s); /*See NOTES */
s:
	传入参数,自定义的描述
返回值：
	无
	向标准出错 stderr 输出出错原因
        
        
范例：
void perror_exit(const char *des){
	//fprintf(stderr, "%s error, reason: %s\n", des, strerror(errno));
	perror(des);
	exit(1);  //close可写可不写，进程结束的时候会释放所有的资源
}       
```

这个函数以及errno全局变量是最常用的获取Linux中错误信息的函数。因此使用起来相当顺手，而且这个函数也可以捕捉所有的Linux中的错误，因为其使用的错误号是全局变量。

劣势也在于此：在获取这个错误时不能完全保证这个错误信息就是之前的，很由可能在获取该信息时错误号和错误信息已经再度更新修改了，会造成误判。在网络编程中，特别是在异步的网络操作时，检测到错误后，再去获取错误是有时间差的，容易被覆盖修改。



**方法二：gai_strerror**

有很多socket相关的函数的错误号和错误信息是无法通过errno，strerror(errno)函数去获取的。其原因在于很多函数并没有将errno.h作为错误码：

> 举例说明：
>
> if getaddrinfo fails, we can’t use perror or strerror to generate an error message. Instead, we need to call gai_strerrorto convert the error code returned into an error message.
>
> 即getaddrinfo失败的错误码不能用 perror or strerror 处理，因为它没有用 errno`(#include <errno.h>)` 作为错误代码。所以使用gai_strerror的主要是为了统一OS的转换的getnameinfo 、getaddrinfo 之类的函数，需要尤其注意。
>
> 缺点：其参数是getnameinfo 、getaddrinfo 之类的函数的执行后的返回值，所以只适用于特定范围。

将getnameinfo 、getaddrinfo 之类的函数的执行失败后的错误码转换成字符串形式：

```cpp
#include＜netdb.h＞
const char*gai_strerror(int error);
```



**方法三：getsockopt(第三个参数SO_ERROR)**

这个函数将获取fd上的错误信息。如果epoll获取select、poll检测到fd上有异常，那么通过getsockopt的SO_ERROR来获取fd上的错误码无疑是最准确地。



# 二、与网络编程相关的Linux高级I/O函数

## （一）pipe、dup/dup2（用于创建文件描述符）

### 1.pipe函数

```cpp
#include＜unistd.h＞
int pipe(int fd[2]);
```

- 创建一个管道，成功时返回0，并将一对打开的文件描述符值填入其参数指向的数组。如果失败，则返回-1并设置errno。

- fd[0]为读端，fd[1]为写端

- 默认情况下，这一对文件描述符都是阻塞的。此时如果我们用read系统调用来读取一个空的管道，则read将被阻塞，直到管道内有数据可读；如果我们用write系统调用来往一个满的管道（见后文）中写入数据，则write亦将被阻塞，直到管道有足够多的空闲空间可用。

  > 如果应用程序将fd[0]和fd[1]都设置为非阻塞的，则read和write会有不同的行为。

- 如果管道的写端文件描述符fd[1]的引用计数减少至0，即没有任何进程需要往管道中写入数据，则针对该管道的读端文件描述符fd[0]的read操作将返回0，即读取到了文件结束标记（End Of File，EOF）；反之，如果管道的读端文件描述符fd[0]的引用计数减少至0，即没有任何进程需要从管道读取数据，则针对该管道的写端文件描述符fd[1]的write操作将失败，并引发SIGPIPE信号。

- 管道内部传输的数据是字节流，这和TCP字节流的概念相同。但二者又有细微的区别。应用层程序能往一个TCP连接中写入多少字节的数据，取决于对方的接收通告窗口的大小和本端的拥塞窗口的大小。而管道本身拥有一个容量限制，它规定如果应用程序不将数据从管道读走的话，该管道最多能被写入多少字节的数据。

  > 自Linux 2.6.11内核起，管道容量的大小默认是65536字节。我们可以使用fcntl函数来修改管道容量（见后文）。

- socket的基础API中有一个socketpair函数。它能够方便地创建双向管道：

  ```cpp
  #include＜sys/types.h＞
  #include＜sys/socket.h＞
  int socketpair(int domain,int type,int protocol,int fd[2]);
  ```

  socketpair前三个参数的含义与socket系统调用的三个参数完全相同，但domain只能使用UNIX本地域协议族AF_UNIX，因为我们仅能在本地使用这个双向管道

  最后一个参数则和pipe系统调用的参数一样，只不过socketpair创建的这对文件描述符都是既可读又可写的

  socketpair成功时返回0，失败时返回-1并设置errno



### 2.dup函数和dup2函数

```cpp
#include＜unistd.h＞
int dup(int file_descriptor);
int dup2(int oldfd,int newfd);
```

- dup用于复制文件描述符，创建一个新的文件描述符，该新文件描述符和原有文件描述符file_descriptor指向相同的文件、管道或者网络连接。返回的文件描述符总是取系统当前可用的最小整数值。

- dup2 函数与 dup 类似，但是它允许将新的文件描述符指定为 newfd。如果 newfd 已经打开，则先关闭它。如果 oldfd 等于 newfd，则 dup2 不会关闭 newfd。如果调用成功，dup2 返回新的文件描述符，如果失败则返回 -1，并设置 errno 来指示错误原因。

- dup和dup2系统调用失败时返回-1并设置errno。

  > 注意　通过dup和dup2创建的文件描述符并不继承原文件描述符的属性，比如close-on-exec和non-blocking等。

- 可以用来把标准输入重定向到一个文件，或者把标准输出重定向到一个网络连接（比如CGI编程），如下CGI服务器：

  ```cpp
  #include＜sys/socket.h＞
  #include＜netinet/in.h＞
  #include＜arpa/inet.h＞
  #include＜assert.h＞
  #include＜stdio.h＞
  #include＜unistd.h＞
  #include＜stdlib.h＞
  #include＜errno.h＞
  #include＜string.h＞
  
  int main(int argc,char*argv[])
  {
      if(argc＜=2)
      {
          printf("usage:%s ip_address port_number\n",basename(argv[0]));
          return 1;
      }
      const char*ip=argv[1];
      int port=atoi(argv[2]);
      
      struct sockaddr_in address;
      bzero(＆address,sizeof(address));
      address.sin_family=AF_INET;
      inet_pton(AF_INET,ip,＆address.sin_addr);
      address.sin_port=htons(port);
      
      int sock=socket(PF_INET,SOCK_STREAM,0);
      assert(sock＞=0);
      
      int ret=bind(sock,(struct sockaddr*)＆address,sizeof(address));
      assert(ret!=-1);
      
      ret=listen(sock,5);
      assert(ret!=-1);
      
      struct sockaddr_in client;
      socklen_t client_addrlength=sizeof(client);
      int connfd=accept(sock,(struct sockaddr*)＆client,＆client_addrlength);
      if(connfd＜0)
      {
      	printf("errno is:%d\n",errno);
      }
      else
      {
          close(STDOUT_FILENO);  //关闭标准输出文件描述符STDOUT_FILENO（其值是1）
          /*
  复制socket文件描述符connfd。因为dup总是返回系统中最小的可用文件描述符，所以它的返回值实际上是1，即之前关闭的标准输出文件描述符的值。
          */
          dup(connfd);  
          printf("abcd\n");
          close(connfd);
      }
      close(sock);
      return 0;
  }
  ```

  这样一来，标准输出就重定向到了socket上，服务器输出到标准输出的内容（这里是“abcd”）就会直接发送到与客户连接对应的socket上，因此printf调用的输出将被客户端获得（而不是显示在服务器程序的终端上）。这就是CGI服务器的基本工作原理。

## （二）readv/writev、sendfile、mmap/munmap、splice和tee（用于读写数据的函数）

### 1.readv/writev

```cpp
#include＜sys/uio.h＞
ssize_t readv(int fd,const struct iovec*vector,int count)；
ssize_t writev(int fd,const struct iovec*vector,int count);
```

- readv函数将数据从文件描述符读到分散的内存块中，即分散读；writev函数则将多块分散的内存数据一并写入文件描述符中，即集中写。

  > 回顾socket中的通用数据读写函数

- struct iovec结构体：

  ```cpp
  struct iovec
  {
      void* iov_base;/*内存起始地址*/
      size_t iov_len;/*这块内存的长度*/
  };
  ```

- count参数是vector数组的长度，即有多少块内存数据需要从fd读出或写到fd。

- readv和writev在成功时返回读出/写入fd的字节数，失败则返回-1并设置errno。它们相当于简化版的recvmsg和sendmsg函数。

web服务器上的集中写：见p103

### 2.mmap/munmap

```cpp
#include＜sys/mman.h＞
void* mmap(void* start,size_t length,int prot,int flags,int fd,off_t offset);
int munmap(void* start,size_t length);
```

- mmap函数用于申请一段内存空间（创建匿名的内存映射）。**将一个文件或者其它对象映射到进程的地址空间，实现文件磁盘地址和进程虚拟地址空间中一段虚拟地址的一一对映关系**。实现这样的映射关系后，进程就可以采用指针的方式读写操作这一段内存，而系统会自动回写脏页面到对应的文件磁盘上，即完成了对文件的操作而不必再调用 read、write 等系统调用函数。相反，内核空间对这段区域的修改也直接反映用户空间

  > 多个进程映射同一文件，还能保证虚拟空间映射到同一块物理内存，达到内存共享的作用。
  >
  > 该函数主要用途有三个：
  >
  > - 将普通文件映射到内存中，通常在需要对文件进行频繁读写时使用，用内存读写取代I/O读写，以获得较高的性能；
  > - 将特殊文件进行匿名内存映射，为关联进程提供共享内存空间；
  > - 为无关联的进程间的Posix共享内存（SystemV的共享内存操作是shmget/shmat）

  munmap函数则释放由mmap创建的这段内存空间。

- start：允许用户使用某个特定的地址作为这段虚拟内存的起始地址。如果它被设置成NULL，则系统自动分配一个地址。

- length：指定内存段的长度。

- prot参数用来设置内存段的访问权限。它可以取以下几个值的按位或：

  ```cpp
  ❑PROT_READ，内存段可读。
  ❑PROT_WRITE，内存段可写。
  ❑PROT_EXEC，内存段可执行。
  ❑PROT_NONE，内存段不能被访问。
  ```

- flags：控制内存段内容被修改后程序的行为。可以被设置为表6-1中的某些值（这里仅列出了常用的值）的按位或（其中MAP_SHARED和MAP_PRIVATE是互斥的，不能同时指定）。

  ![](assets/f0adc8e66183111da635d7ff83919eb9.png)

- fd：被映射文件对应的文件描述符。它一般通过open系统调用获得。offset参数设置从文件的何处开始映射（对于不需要读入整个文件的情况）。

- mmap函数成功时返回指向目标内存区域的指针，失败则返回MAP_FAILED（(void*)-1）并设置errno。munmap函数成功时返回0，失败则返回-1并设置errno。

### 3.sendfile

```cpp
#include＜sys/sendfile.h＞
ssize_t sendfile(int out_fd,int in_fd,off_t* offset,size_t count);
```

- 用于在两个文件描述符之间直接传递数据，例如如果是网络IO：硬盘->内核文件缓冲区->内核网络缓冲区

  > **完全在内核中操作，从而避免了内核缓冲区和用户缓冲区之间的数据拷贝，效率很高，这被称为零拷贝。**

- offset指定从in_fd的哪个位置开始读，写入到out_fd中，如果为空，则使用读入文件流默认的起始位置；count参数指定在文件描述符in_fd和out_fd之间传输的字节数。

- sendfile成功时返回传输的字节数，失败则返回-1并设置errno。

用sendfile函数传输文件：见p106

### 4.splice和tee

**①splice：**

```cpp
#include＜fcntl.h＞
ssize_t splice(int fd_in,loff_t* off_in,int fd_out,loff_t* off_out,size_t len,unsigned int flags);
```

- 用于在两个文件描述符之间移动数据，也是零拷贝操作。

- 前四个参数都与senfile意义一样，但fd_in可以是一个管道文件描述符，并且此时off_in参数必须被设置为NULL。len指定移动数据的长度

- flags参数则控制数据如何移动，它可以被设置为表6-2中的某些值的按位或：

  ![](assets/ccd83a9d007a400caaba0b2242d8ad37.png)

- splice函数调用成功时返回移动字节的数量。它可能返回0，表示没有数据需要移动，这发生在从管道中读取数据（fd_in是管道文件描述符）而该管道没有被写入任何数据时。splice函数失败时返回-1并设置errno。常见的errno如表6-3所示。

  ![](assets/b8eda90c799e11a2a0a52e2c164dc07c.png)

**②tee**

```cpp
#include＜fcntl.h＞
ssize_t tee(int fd_in,int fd_out,size_t len,unsigned int flags);
```

- 用于在两个管道文件描述符之间复制数据，也是零拷贝操作。它不消耗数据，因此源文件描述符上的数据仍然可以用于后续的读操作。
- 成功时返回在两个文件描述符之间复制的数据数量（字节数）。返回0表示没有复制任何数据。tee失败时返回-1并设置errno。



### 5.小结区别（详细转零拷贝技术）

1. sendfile:

   in_fd必须是一个支持类似mmap函数的文件描述符，即它必须指向真实的文件，不能是socket和管道；而out_fd则必须是一个socket。由此可见，sendfile几乎是专门为在网络上传输文件而设计的。

   

2. splice：

   fd_in可以是一个管道文件描述符，并且fd_in和fd_out必须至少有一个是管道文件描述符。

   

3. tee：

   fd_in和fd_out必须都是管道文件描述符，并且它不消耗管道中的数据



## （三）fcntl函数（控制文件描述符属性，即I/O属性的通用POSIX方法）

```cpp
#include＜fcntl.h＞
int fcntl(int fd,int cmd,…);
```

- 提供了对文件描述符的各种控制操作。另外一个常见的控制文件描述符属性和行为的系统调用是ioctl，而且ioctl比fcntl能够执行更多的控制。但是，对于控制文件描述符常用的属性和行为，fcntl函数是由POSIX规范指定的首选方法。

- fd参数是被操作的文件描述符，cmd参数指定执行何种类型的操作。根据操作类型的不同，该函数可能还需要第三个可选参数arg。

  ![](assets/40e4441182dc89fd5c4e88403e43e023.png)

  ![](assets/a0ea7937d4ba4a19982d870ed94c5aa2.png)

- fcntl函数成功时的返回值如表6-4最后一列所示，失败则返回-1并设置errno。

- 在网络编程中，fcntl函数通常用来将一个文件描述符设置为非阻塞的，或者回顾创建socket内容：自Linux内核版本2.6.17起，type参数可以接受上述服务类型与下面两个重要的标志相与的值：SOCK_NONBLOCK和SOCK_CLOEXEC。

  ```cpp
  int setnonblocking(int fd)
  {
      int old_option=fcntl(fd,F_GETFL);    /*获取文件描述符旧的状态标志*/
      int new_option=old_option|O_NONBLOCK;/*设置非阻塞标志*/
      fcntl(fd,F_SETFL,new_option);
      return old_option;                   /*返回文件描述符旧的状态标志，以便*/
                                           /*日后恢复该状态标志*/
  }
  ```

- 注意：SIGIO和SIGURG这两个信号与其他Linux信号不同，它们必须与某个文件描述符相关联方可使用：

  当被关联的文件描述符可读或可写时，系统将触发SIGIO信号；当被关联的文件描述符（而且必须是一个socket）上有带外数据可读时，系统将触发SIGURG信号。

  将信号和文件描述符关联的方法，就是**使用fcntl函数为目标文件描述符指定宿主进程或进程组**，那么被指定的宿主进程或进程组将捕获这两个信号（可以理解为设置一个用来接受SIGIO信号的进程）

  使用SIGIO时，还需要利用fcntl设置其O_ASYNC标志（异步I/O标志，不过SIGIO信号模型并非真正意义上的异步I/O模型）。




















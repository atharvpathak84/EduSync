#include <bits/stdc++.h>


using namespace std;
#define testcases           int T;cin>>T;while(T--)
#define ll                  long long
#define pb                  push_back
#define rep(i,a,b)          for(int i=a;i<b;i++)
#define repin(i,a,b)        for(int i=a;i>b;i--)
#define fl                  float
#define dbl                 double
#define cn(x)               cin>>x;
#define ct(x)               cout<<x<<endl;


void solution()
{
    int n;
    cin>>n;
    int m=0;
    int s;
    if(n==1 || n==2){
        cout<<"0"<<endl;
        return;
    }
    else if(n==3){
        cout<<"2"<<endl;
        return;
    }
    else if(n==4){
        cout<<"3"<<endl;
        return;
     }
    else if(n==5){
        cout<<"5"<<endl;
        return;
     }
    else if(n>=6){
    for(int i=3;i<= n-3;i++){
        m=m+i;
    }
   s=m+4;
    cout<<s<<endl;
    return;
    }
  
    
    
}

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    

    // test();
    testcases
    solution();


    return 0;
}
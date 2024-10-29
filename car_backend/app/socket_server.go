package app

import(
	"time"
	"net"
	"errors"
	"fmt"
	"sync"

)

// 服务器基础信息
type SocketServerStruct struct{
	Port string `json:"port"` //监听端口
	ServerType string `json:"server_type"` //监听端口
	Status string `json:"status"` //连接状态
	AutoReStart bool `json:"AutoReStart"` //连接状态 //自动重启,"yes","no"
	SaveFriquent int `json:"save_friquent"` //存储频率，秒/次
	CacheChanNum int `json:"cache_chan_num"` //缓存接收数据数量
	Clients SocketClientArryStrcut //链接服务器的client详情
	listener net.Listener
	saveDataCache chan SaveDataStruct

}

// 客户端
type SocketClientStrcut struct{
	Name string `json:"name"` //设备标识
	Dynamic map[string]string `json:"dynamic"` //更新
	Data map[string]string `json:"data"` //基本数据
	conn net.Conn 
}

type SocketClientArryStrcut struct{
	Data []*SocketClientStrcut
	sync.Mutex //锁
}

func (self *SocketClientArryStrcut)AddFunc(data *SocketClientStrcut){
	if self.GetFunc(data.Name) != nil {
		WriteLog(fmt.Sprintf("name：%s 已存在",data.Name))
		return
	} 
	self.Lock()
	defer func(){
		self.Unlock()
	}()
	self.Data = append(self.Data,data)
}

func (self *SocketClientArryStrcut)GetFunc(name string)(data *SocketClientStrcut){
	for k,v := range self.Data{
		if v.Name == name {
			data = self.Data[k]
			break
		}
	}
	return
}

func (self *SocketClientArryStrcut)DelFunc(name string){
	self.Lock()
	defer func(){
		self.Unlock()
	}()
	nd := []*SocketClientStrcut{}
	for k,v := range self.Data{
		if v.Name == name {
			continue
		}
		nd = append(nd,self.Data[k])
	}
	self.Data = nd
}

// 启动服务器监听
func (self *SocketServerStruct)HandleListen(k string)(err error){

	self.AutoReStart = true

	for {

		err = self.ListenFunc("listen")
		if err != nil {

			WriteLog(fmt.Sprintf("%s Listen err:%s Auto ReStart:%v",self.Port,err.Error(),self.AutoReStart))
			time.Sleep(time.Second)
		}else{

			WriteLog(fmt.Sprintf("Listen %s success",self.Port))
			self.Status = "on"
			err = self.OnListen()
			if err != nil {
				self.Status = "off"
				WriteLog(fmt.Sprintf("%s,%s服务器断开%s",self.ServerType,self.Port,err.Error()))
			}
		}

		if !self.AutoReStart {
			break
		}
	}
	return
}

// 监听
func (self *SocketServerStruct)ListenFunc(k string)(err error){

	if k == "break" {
		if self.listener != nil {
			self.listener.Close()
			self.listener = nil
			self.AutoReStart = false
		}
		return
	}

	if self.listener != nil {
		err = errors.New("已启动")
		return
	}
	if self.Port == "" {
		err = errors.New("PORT未设置")
		return
	}

	portStr := ":"+ self.Port
	self.listener, err = net.Listen(self.ServerType, portStr)

	return
}

// 服务器收到新的连接请求
func (self *SocketServerStruct)OnListen()(err error){
	for {
		// Wait for a connection.
		var conn net.Conn
		conn, err = self.listener.Accept()
		if err != nil {
			return
		}

		go self.HandleConnect(conn)
	}
}

// 服务器配置初始化
func SocketServerStart(){
	// server := ConfigDetail.SocketServerStruct
	LoadFromFile("device_dynamic.json",&ConfigDetail.Clients)
	ConfigDetail.SocketServerStruct.saveDataCache = make(chan SaveDataStruct,ConfigDetail.CacheChanNum)
	go ConfigDetail.SocketServerStruct.HandleListen("start")
	go ConfigDetail.SocketServerStruct.HandleSave()
}




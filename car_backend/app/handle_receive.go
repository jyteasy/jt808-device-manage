package app

import(
	"time"
	"net"
	"fmt"
	"bufio"
)

// 处理接收数据
func(self *SocketServerStruct)HandleConnect(conn net.Conn){

	client := &SocketClientStrcut{}
	defer func(){
        if conn != nil {
            conn.Close()
        }
    }()

    buf := bufio.NewReader(conn)

    for {
    	recvData, err := buf.ReadString('~')
        if recvData == "~" {
            continue
        }
        if err != nil {
            return
        }
        result,err := AanlysisJT808(recvData)
        if err != nil {
        	break
        }

        if result["device_id"] == "" {
        	break
        }

        if client.Name == "" {
        	client = self.Clients.GetFunc(result["device_id"])
        	if client == nil {
        		WriteLog(fmt.Sprintf("device%s 未登记",result["device_id"]))
        		break
        	}
        }else{
        	if client.Name != result["device_id"] {
        		WriteLog(fmt.Sprintf("client old name:%s ,new name:%s",client.Name,result["device_id"]))
        		break
        	}
        }

        for k,_ := range result {
        	if result[k] != "" {
        		client.Dynamic[k] = result[k]
        	}
        }
        self.AddChan(result)
    }
}

func(self *SocketServerStruct)AddChan(data map[string]string){
	if len(self.saveDataCache) < self.CacheChanNum {
		saveObj := SaveDataStruct{0,time.Now(),data}
		self.saveDataCache <- saveObj
	}else{
		WriteLog(fmt.Sprintf("saveDataCache full %d:",len(self.saveDataCache)))
	}

}

// 处理文件存储
func(self *SocketServerStruct)HandleSave(){
	startTs := time.Now().Unix()
	saveDynamicTime  := time.Now().Unix()
	for {

		chanLen := len(self.saveDataCache)
		if chanLen > 0 {
			save := false
			if time.Now().Unix() - startTs > int64(self.SaveFriquent) {
				save = true
			}
			if chanLen >= self.CacheChanNum {
				save = true
			}

			if save {
				
				saveDataArry := []SaveDataStruct{}
				for i:=0;i<chanLen;i++{
					saveDataArry = append(saveDataArry,<-self.saveDataCache)
				}
				SaveDataFunc(saveDataArry)
				startTs = time.Now().Unix()

			}
		}else{
			if time.Now().Unix() - saveDynamicTime > 600 {
				WriteFile("device_dynamic.json",ConfigDetail.Clients)
				saveDynamicTime  = time.Now().Unix()
			}
			time.Sleep(time.Second)
		}
	}
}

// 存储格式
type SaveDataStruct struct {
	ID int `json:"id"`
	SaveTime time.Time `json:"save_time"`
	Data map[string]string `json:"data"`
}

var dbChan = make(chan int,1)

func QueryDataFunc(name,s,e string)(data []SaveDataStruct){
	dbChan <- 1
	defer func(){
		<- dbChan
	}()
	sTime,_ := time.ParseInLocation(TimeLayout1,s,LocalTimezone)
	eTime,_ := time.ParseInLocation(TimeLayout1,e,LocalTimezone)
	
	existData := []SaveDataStruct{}
	LoadFromFile("device_db.json",&existData)
	for k,v := range existData {
		if v.ID == 0 {
			continue
		}
		if v.Data["device_id"] != name {
			continue
		}
		
		if v.SaveTime.After(sTime) && v.SaveTime.Before(eTime) {
			data = append(data,existData[k])
		}else{
		}
	}
	return
}

func SaveDataFunc(data []SaveDataStruct){
	dbChan <- 1
	defer func(){
		<- dbChan
	}()
	existData := []SaveDataStruct{}
	LoadFromFile("device_db.json",&existData)
	for k,_ := range data {
		data[k].ID = len(existData) + k + 1
	}
	existData = append(existData,data...)
	WriteFile("device_db.json",existData)
}

func DelDataFunc(idArr []int){
	dbChan <- 1
	defer func(){
		<- dbChan
	}()
	idArrMap := map[int]bool{}
	for _,v := range idArr{
		idArrMap[v] = true
	}
	existData := []SaveDataStruct{}
	LoadFromFile("device_db.json",&existData)
	for k,v := range existData {
		if idArrMap[v.ID] {
			existData[k].ID = 0
			existData[k].Data = map[string]string{}
		}
	}
	WriteFile("device_db.json",existData)
}

	
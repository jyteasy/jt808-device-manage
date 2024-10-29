package app

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"log"
	"time"
	"fmt"
)

// 系统运行日志
var RunLog *log.Logger
const TimeLayout = "2006-01-02 15:04:05.999" // 毫秒 示例:2020-08-31 15:39:26.722
const TimeLayout1 = "2006-01-02 15:04:05" // 毫秒 示例:2020-08-31 15:39:26.722
const TimeLayout2 = "2006-01-02" // 毫秒 示例:2020-08-31 15:39:26.722
const TimeLayout4 = "2006-01-02 15:04:05.999" // 毫秒 示例:2020-08-31 15:39:26.722
const TimeLayout5 = "2006-01-02 15:04"
const TimeLayout6 = "2006-01"
var LocalTimezone *time.Location

var AppDir = ""
func init() {
	dataDir := filepath.Join(AppDir, "data")
	if PathExists(dataDir) == false {
		err := os.MkdirAll(dataDir, os.ModePerm)
		if err != nil {
			return
		}
	}
	runFile := filepath.Join(AppDir, "data", "run.log")
	RunLog = log.New(LogFileInit(runFile), "", log.LUTC)
	LocalTimezone, _ = time.LoadLocation("Asia/Shanghai")
	LoadFromFile("conf.json",&ConfigDetail)
}

func LogFileInit(logFileName string)(file *os.File){
	file, err := os.OpenFile(logFileName, os.O_APPEND|os.O_CREATE|os.O_RDWR, 0666)
	if err != nil {
		WriteLog(fmt.Sprintf("打开log文件:%s,失败:%s",logFileName,err.Error()))
	}
	return
}

func WriteLog(details string) {
	// 运行日志
	fmt.Printf("%s>>%s \n",  time.Now().Format(TimeLayout4),details)
	RunLog.Printf("%s,%d>>%s",  time.Now().Format(TimeLayout4), time.Now().UnixNano()/1e6, details)
}

func PathExists(path string) bool {
	// 判断文件或文件夹是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	} else {
		return true
	}
}

// 系统基本配置
type StructConfig struct {
	WebPort string `json:"web_port"`//系统运行的端口，默认8090
	DeviceApi string `json:"device_api"`//数据获取api
	BaiDuMapAppKey string `json:"baidu_map_app_key"`//百度在线地图的密钥
}
var ConfigDetail = StructConfig{}
// 配置文件写入
func WriteFile(f string,d interface{})(err error){
	jf := filepath.Join(AppDir, "data", f)
	fileData, _ := json.Marshal(d)
	err = ioutil.WriteFile(jf, fileData, 0644)
	if err != nil {
		WriteLog("写入配置文件错误:"+err.Error())
	}
	return
}
// 读取配置文件
func LoadFromFile(fn string,d interface{})(err error){
	jf := filepath.Join(AppDir, "data", fn)
	dataByte := []byte{}
	dataByte, err = ioutil.ReadFile(jf)
	if err != nil {
		if fn == "conf.json" {
			// 生成默认配置文件
			if ConfigDetail.WebPort == "" {
				ConfigDetail.WebPort = "8090" 
				ConfigDetail.DeviceApi = "http://127.0.0.1:18090"
				WriteFile("conf.json",ConfigDetail)
			}
		}
		err = errors.New(fmt.Sprintf("file:%s ioutil.ReadFile err:%s",fn,err.Error()))
		WriteLog(err.Error())
		return
	}
	err = json.Unmarshal(dataByte,&d)
	if err != nil {
		err = errors.New(fmt.Sprintf("file:%s Unmarshal err:%s",fn,err.Error()))
		WriteLog(err.Error())
	}
	return 
}


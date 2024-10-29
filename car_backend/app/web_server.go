package app

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"os"
	"net/http"
	"errors"
)

// web服务器
func WebServer() {
	defer func() {
		WriteLog(fmt.Sprintf("Web服务退出"))
	}()

	gin.DisableConsoleColor()
	// 发行版（不能实时更新html）
	//gin.SetMode(gin.ReleaseMode)
	f, _ := os.Create("gin.log")
	gin.DefaultWriter = io.MultiWriter(f)
	r := gin.Default()
	r.Use(Cors())

	r.NoRoute(Home404)
	// 接收设备标记，没有记录的不处理接收数据
	r.GET("/device_get", DeviceGet)
	r.POST("/device_post", DevicePost)
	// add,update,del设备基本信息

	// 设备轨迹库存查询，删除
	r.POST("/trail", TrailPost)

	port := ConfigDetail.WebPort
	if port == "" {
		port = "18090"
	}
	
	err := r.Run(":"+port)
	if err != nil{
		WriteLog("Web服务启动失败err:"+err.Error())
	}
}

func Home404(c *gin.Context) {
	c.JSON(http.StatusNotFound, HttpReturn{1,"404",nil})
}

type HttpReturn  struct {
	Code int            `json:"code"`
	Msg  string         `json:"msg"`
	Data interface{} `json:"data"`
}

// 设备管理，get请求处理
func DeviceGet(c *gin.Context) {
	var err error
	returnInfo := HttpReturn{}
	action := c.Query("action")
	defer func(){
		if action != "" {
			if err != nil {
				returnInfo.Code = 1
				returnInfo.Msg = err.Error()
			}
			c.JSON(http.StatusOK, returnInfo)
		}
	}()

	switch action {
	case"get":
		// 设备的最新动态信息
		info := ConfigDetail.Clients.Data
		returnInfo.Data = info
	case"query_one":
		// 设备的最新动态信息
		info := ConfigDetail.Clients.Data
		param := c.Query("param")
		if param == "" {
			err = errors.New("query param为空")
			return
		}
		for k,v := range info {
			if v.Name == param {
				returnInfo.Data = info[k]
				break
			}
		}
	}

	return
}

// 设备管理，Post请求处理
func DevicePost(c *gin.Context) {
	var err error
	returnInfo := HttpReturn{}
	action := c.Query("action")
	defer func(){
		if err != nil {
			returnInfo.Code = 1
			returnInfo.Msg = err.Error()
		}
		c.JSON(http.StatusOK, returnInfo)
	}()

	if action == "" {
		err = errors.New("no action")
		return
	}

	param := map[string]string{}
	err = c.ShouldBind(&param)
	if err != nil {
		return
	}

	name := param["device_id"]
	if name == "" {
		err = errors.New("device_id为空")
		return
	}

	switch action {
	case"add":

		exist := ConfigDetail.Clients.GetFunc(name)
		if exist != nil {
			err = errors.New(fmt.Sprintf("device_id:%s 已存在",name))
			return
		}
		data := &SocketClientStrcut{}
		data.Name = name
		data.Dynamic = map[string]string{}
		data.Data = param
		ConfigDetail.Clients.AddFunc(data)
		returnInfo.Data = data

	case"update":
		existName := param["device_id_old"]
		exist := ConfigDetail.Clients.GetFunc(existName)
		if exist == nil {
			err = errors.New(fmt.Sprintf("device_id:%s 不存在",existName))
			return
		}
		if existName != name {
			repeat := ConfigDetail.Clients.GetFunc(name)
			if repeat != nil {
				err = errors.New(fmt.Sprintf("device_id:%s 已存在",name))
				return
			}
			exist.Name = name
		}
		delete(param,"device_id_old")
		exist.Data = param
		returnInfo.Data = exist
	case"del":
		ConfigDetail.Clients.DelFunc(param["device_id"])
	}
	returnInfo.Msg = "ok"
	WriteFile("conf.json",ConfigDetail)

	return
}

func TrailPost(c *gin.Context) {
	var err error
	returnInfo := HttpReturn{}
	action := c.Query("action")
	defer func(){
		if err != nil {
			returnInfo.Code = 1
			returnInfo.Msg = err.Error()
		}
		c.JSON(http.StatusOK, returnInfo)
	}()

	if action == "" {
		err = errors.New("no action")
		return
	}

	switch action{
	case"query_trail":
		param := struct{
			STime string `json:"s_time"`
			ETime string `json:"e_time"`
			DeviceID string `json:"device_id"`
		}{}
		
		err = c.ShouldBind(&param)
		if err != nil {
			err = errors.New("参数错误"+err.Error())
			return
		}

		returnInfo.Data = QueryDataFunc(param.DeviceID,param.STime,param.ETime)
	}
}

// 跨域
func Cors() gin.HandlerFunc {
    return func(c *gin.Context) {
    	origin := c.Request.Header.Get("origin")
        c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With")
 		// fmt.Printf("method:%s,origin:%s \n",c.Request.Method,origin)
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
        }
        c.Next()
    }
}
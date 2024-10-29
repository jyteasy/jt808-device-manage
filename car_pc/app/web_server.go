package app

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"io"
	"os"
	"net/http"
	"errors"
	"path/filepath"
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

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"*"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "PATCH"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	r.LoadHTMLGlob(filepath.Join(AppDir, "template", "*"))
	r.Static("/static", filepath.Join(AppDir, "static"))
	r.Static("/template", filepath.Join(AppDir, "template"))
	r.StaticFile("favicon.ico", filepath.Join(AppDir, "static", "favicon.ico"))
	r.NoRoute(Home404)
	r.GET("/", IndexGet)
	r.POST("/", IndexPost)

	port := ConfigDetail.WebPort
	if port == "" {
		port = "8090"
	}
	
	err := r.Run(":"+port)
	if err != nil{
		WriteLog("Web服务启动失败err:"+err.Error())
	}
}

func Home404(c *gin.Context) {
	c.HTML(http.StatusNotFound,"404.html", HttpReturn{1,"404",nil})
}

type HttpReturn  struct {
	Code int            `json:"code"`
	Msg  string         `json:"msg"`
	Data interface{} `json:"data"`
}

// 设备管理，get请求处理
func IndexGet(c *gin.Context) {
	c.HTML(http.StatusOK,"index.html", gin.H{"map_key": ConfigDetail.BaiDuMapAppKey,"device_api":ConfigDetail.DeviceApi})
	return
}

// 设备管理，Post请求处理
func IndexPost(c *gin.Context) {
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
	fmt.Printf("param%v",param)
	err = c.ShouldBind(&param)
	if err != nil {
		return
	}

	return
}

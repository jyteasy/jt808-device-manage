package app

import (
	"fmt"
)

func Start() {
	defer func() {
		WriteLog("system break")
		r := recover()
		if r != nil {
			WriteLog(fmt.Sprintf("system panic %s", r))
		}
	}()

	WriteLog("系统启动,PORT:"+ConfigDetail.WebPort) // 系统启动
	WebServer()

}


 

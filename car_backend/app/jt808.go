
package app

import (
	"fmt"
	"strconv"
	"strings"
	"time"
    "encoding/hex"
    "bytes"
    "errors"
)


// 808解析函数主体
func AanlysisJT808(recv string)(result map[string]string,err error){
    result = make(map[string]string)
    d1 := recv[0:len(recv)-1]
    data := fmt.Sprintf("%x",d1)
    data = Change7D01Func("receive",data)
    // 校验
    checkres := BccCheck(data[0:len(data)-2]) 
    if checkres != data[len(data)-2:]{
        msg := fmt.Sprintf("BccCheck-failed,new_check:%s,data:%s",checkres,data)
        err = errors.New(msg)
        WriteLog(msg)
        return
    }
    // 去掉校验码
    data = data[0:len(data)-2]
    // # 数据头处理，命令id，是否包含分包处理，电话号码，数据流水号
    if len(data) < 24 {
        err = errors.New("数据长度异常,head<24")
        return
    }
    headLen := 24
    result["mesg_id"] = data[0:4]
    result["mesg_property"] = data[4:8]
    result["phone_num"] = data[8:20]
    result["mesg_num"] = data[20:24]

    mesg_id := result["mesg_id"]

    explainNum,_ := strconv.ParseInt(result["mesg_property"],16,0)
    mesg_property := fmt.Sprintf("%016x",explainNum)

    if mesg_property[2]=='1'{
        // 消息分包
        if len(data) < 32 {
            err = errors.New("消息体属性分包结构,数据长度异常,head<32")
            return
        }
        headLen += 8
        result["total"] = data[24:28]
        result["current"] = data[28:32]
    }

    dataBody := data[headLen:]

    if mesg_property[5] == '1' {
        // 消息体RSA解密转码
        fmt.Println("RSA_algorithm_encryption")
    }

    switch mesg_id{
    case "0001":
        if len(dataBody) < 10 {
            err = errors.New("mesgid 0001异常,<10")
            return
        }
        result["answer_num"] = dataBody[0:4]
        result["answer_id"] = dataBody[4:8]
        result["command_result"] = dataBody[8:]
    case "0100":
        if len(dataBody) < 52 {
            err = errors.New("mesgid 0100 异常,<52")
            return
        }
        result["Provincial_ID"] = dataBody[0:4]
        result["City_County_ID"] = dataBody[4:8]
        result["Manufacturer_ID"] = dataBody[8:18]
        result["Terminal_model"] = dataBody[18:34]
        result["Terminal_ID"] = dataBody[34:48]
        result["car_num_color"] = dataBody[48:50]
        result["car_identification"] = dataBody[50:]

    case "0102":  
        // 终端重连上报鉴权
        result["re_connect_auth"] = dataBody
    
    case "0200":  
        // 位置消息
        if len(dataBody) < 56 {
            err = errors.New("mesgid 0200 异常, < 56")
            return
        }
        result = PositionReport(dataBody,result)
    }

    result["recv_ts"] = time.Now().Format(TimeLayout1)
    result["device_id"] = result["phone_num"]
    // fmt.Println("result-->",result)

    return
   
}

// 位置数据处理
func PositionReport(data string,loca_data map[string]string)(map[string]string){
    
    // mainLen := 56
    // 报警未和状态为的原始信息
    loca_data["alarm_unformat"] = data[0:8]
    loca_data["status_unformat"] = data[8:16]
    loca_data["lat"] = data[16:24]
    loca_data["lng"] = data[24:32]
    loca_data["hight"] = data[32:36]
    loca_data["speed"] = data[36:40]
    loca_data["direct"] = data[40:44]
    loca_data["track_ts"] = data[44:56]
    // 报警标志
    alarmArr := []string{}
    alarmNum,_ := strconv.ParseInt(data[0:8],16,0)
    // fmt.Println("alarmstr",data[0:8])
    alarmStatus := fmt.Sprintf("%032b",alarmNum)
    alarmMap := map[int]string{
        0:"",
        1:"rollover",2:"hit_rollover",3:"move_illeag",4:"luanch_illeag",
        5:"steal",6:"oil_unnormal",7:"vss_trouble",8:"line_shift",
        9:"road_time_alarm",10:"in_out_line",11:"in_out_area",12:"stop_over_time",
        13:"drive_over_time",14:"right_blind_area",15:"tire_pressure",16:"drive_illeag",
        17:"tired_drive_pre",18:"over_speed_pre",19:"ic_card_trouble",20:"camera_broke",
        21:"tts_broke",22:"lcd_broke",23:"power_off",24:"power_low",25:"gnss_short_circuit",
        26:"gnss_unconnect",27:"gnss_borke",28:"danger_drive",29:"tired_drive",30:"over_speed",31:"sos",

    }

    for k := 0;k<len(alarmStatus);k++ {
        if alarmStatus[k] == '1' {
            key := alarmMap[k]
            alarmArr = append(alarmArr,key)
        }
    }

    loca_data["alarm"] = strings.Join(alarmArr,",")

    statusData := []string{}
    statusNum,_ := strconv.ParseInt(data[8:16],16,0)
    statusInfo := fmt.Sprintf("%032b",statusNum)
    // fmt.Println(loca_data["status"],statusNum,statusInfo)
    if statusInfo[32-1]=='1'{
        statusData=append(statusData,"acc_on")
    }else{
        statusData=append(statusData,"acc_off")
    }

    if statusInfo[32-2]=='1'{
        statusData=append(statusData,"track")
    }else{
        statusData=append(statusData,"un_track")
    }

    if statusInfo[32-11]=='1'{
        statusData=append(statusData,"oil_cut")
    }

    if statusInfo[32-12]=='1'{
        statusData=append(statusData,"power_cut")
    }
    
    loca_data["status"] = strings.Join(statusData,",")
    
    latNum,_ := strconv.ParseInt(loca_data["lat"],16,0)
    lat := fmt.Sprintf("%5f",float64(latNum) / 1000000)
    loca_data["lat"] = lat
    lngNum,_ := strconv.ParseInt(loca_data["lng"],16,0)
    lng := fmt.Sprintf("%5f",float64(lngNum) / 1000000) 
    loca_data["lng"] = lng

    hightNum,_ := strconv.ParseInt(loca_data["hight"],16,0)
    hight := fmt.Sprintf("%d",hightNum)
    loca_data["hight"] = hight

    speedNum,_ := strconv.ParseInt(loca_data["speed"],16,0)
    speed := fmt.Sprintf("%d",int(speedNum/10))
    loca_data["speed"] = speed

    directNum,_ := strconv.ParseInt(loca_data["direct"],16,0)
    direct := fmt.Sprintf("%d",directNum)
    loca_data["direct"] = direct

    track_ts :=loca_data["track_ts"]
    if track_ts == "000000000000" {
        track_ts = ""
    }else{
        track_ts = fmt.Sprintf("20%s-%s-%s %s:%s:%s",track_ts[0:2],track_ts[2:4],track_ts[4:6],track_ts[6:8],track_ts[8:10],track_ts[10:12])
    }
    
    loca_data["track_ts"] = track_ts
   
    return loca_data
}

// 接收应答
func JT808Resopnes(data map[string]string)(response string){

    mesg_id := data["mesg_id"]
    phone_num := data["phone_num"]
    mesg_num := data["mesg_num"]
    dataIndex,_ := strconv.Atoi(data["data_index"]) 
    body := fmt.Sprintf("%s%s",mesg_num,mesg_id)
    response_mesg_id := "8001"
    
    switch mesg_id {
    case"0100":
        // 注册应答8100
        response_mesg_id = "8100"
        // 注册鉴权
        auth := "313233343536"
        body = body+auth
    default:
        // 通用应答8001
        // 0：成功/确认；1：失败；2：消息有误；3：不支持；4：报警结果处理确认；
        body = body+"00"
    }
    // 消息头，回复ID，消息体属性，手机号，消息流水号
    head :=  fmt.Sprintf("%s%04x%s%04x",response_mesg_id,len(body)/2,phone_num,dataIndex)
    response = head+body
    response = PackageData(response)

    return 
}

// 异或校验
func BccCheck(data string)(res string){
    var xor byte
    dataByte,_ := hex.DecodeString(data)
    for k,_ := range dataByte {
        xor ^= dataByte[k]
    }
    res = fmt.Sprintf("%02x",xor)
    return 
}

// 数据转义/封装
func PackageData(data string)string{

    /*
    :param data: 消息头+消息体
    :return: 转义后的数据。标识位+消息头+消息体+校验+标识位
    */
    check := BccCheck(data)
    
    data += check 
    // fmt.Println("check--->转义前",check,data)
    data = Change7D01Func("send",data)
    // fmt.Println("check转义后",check,data)
    
    data = fmt.Sprintf("7e%s7e",data)

    return data
}
// 数据转义/封装
func Change7D01Func(k,data string)string{

    dataByte,_ := hex.DecodeString(data)
    b7d,_ := hex.DecodeString("7d")
    b7e,_ := hex.DecodeString("7e")
    b7d01,_ := hex.DecodeString("7d01")
    b7d02,_ := hex.DecodeString("7d02")
    switch k{

    case"send":
        dataByte = bytes.Replace(dataByte,b7d,b7d01,-1)
        dataByte = bytes.Replace(dataByte,b7e,b7d02,-1)
    case"receive":
        dataByte = bytes.Replace(dataByte,b7d02,b7e,-1)
        dataByte = bytes.Replace(dataByte,b7d01,b7d,-1)
    }
    
    return fmt.Sprintf("%x",dataByte)

}


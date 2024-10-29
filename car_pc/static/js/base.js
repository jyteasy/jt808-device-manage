// 通用标准函数
var ajax_get_func=function(url,param,handle_func=""){
    url=url+"?action="+param
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        cache: false,
        success: function (v) {
            if(v.code==0){
                var data=v.data
                if (handle_func!==""){
                    handle_func(data)
                }
            }
            if(v.msg!==""){
                layer.msg(v.msg)
            }
        },
        error:function(d){
            console.log(d)
        }
    });
}

var ajax_post_func=function(url,param,data,handle_func=""){
    url=url+"?action="+param
    
    $.ajax({
        url: url,
        type: 'post',
        contentType: 'application/json',
        data:data,
        success: function (v) {
            if(v.code==0){
                var data=v.data
                if (handle_func!==""){
                    handle_func(data)
                }
            }
            if(v.msg!==""){
                layer.msg(v.msg)
            }
            
        },
        error:function(d){
            console.log(d)
        }
    });
}

var copy_func = function(d){
    let v = JSON.stringify(d)
    let res = JSON.parse(v)
    return res
}
$(document).ready(function(){
	$.get("http://localhost:3000/get_image?=12131", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
})
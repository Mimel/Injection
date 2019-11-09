canvas = document.getElementById('env_view')
ctxt = canvas.getContext('2d')


window.addEventListener 'resize', (event) ->
  ctxt.canvas.width = window.innerWidth - 300
  ctxt.canvas.height = window.innerHeight

  ctxt.fillStyle = 'green'
  ctxt.fillRect(10, 10, 150, 100)

ctxt.canvas.width = window.innerWidth - 300
ctxt.canvas.height = window.innerHeight

ctxt.fillStyle = 'green'
ctxt.fillRect(10, 10, 150, 100)

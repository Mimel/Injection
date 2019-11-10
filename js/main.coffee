(($) ->
  nodeStarter = '@'
  fieldStarter = '#'
  storeChar = '$'
  valueStarter = [fieldStarter, storeChar]
  commentChar = '%'

  # This represents a virtual node in the Inject.ion network.
  class Node
    constructor: (@name, @type, @fields, links) ->
      @linksTo = {}
      for child of links
        if links.hasOwnProperty(child)
          @linksTo[child] = new Node links[child].name, links[child].type, links[child].fields, links[child].linksTo

    copy: () ->
      # Retrieved from Michael Jasper's answer,
      # From https://stackoverflow.com/questions/5364650/cloning-an-object-in-javascript
      deepCopy = JSON.parse(JSON.stringify(this))
      return new Node deepCopy.name, deepCopy.type, deepCopy.fields, deepCopy.linksTo

    followPath: (path) ->
      currentNode = this
      if path.length != 0
        currentNode = @linksTo[path[0]]
        return currentNode.followPath(path.slice(1))
      return currentNode

    # No validation for disparate trees.
    checkAgainst: (node) ->
      # Compare all fields.
      for field of @fields
        if @fields.hasOwnProperty(field)
          console.log(@fields[field])
          console.log(node.fields[field])
          if @fields[field] != node.fields[field]
            return false

      # Go to compare all fields of children.
      for link of @linksTo
        if @linksTo.hasOwnProperty(link)
          if !@linksTo[link].checkAgainst(node.linksTo[link])
            return false

      return true

  # Contains every single Inject.ion command.
  commandDictionary =
    # Goes to the following node, carrying a value.
    # Expects 2 parameters, a node, and a value.
    inject: (values, env) ->
      node = values[0]
      value = values[1]
      # '$' and '~' will do nothing.
      if node.charAt(0) == nodeStarter and valueStarter.includes(value.charAt(0))
        if value.charAt(0) == fieldStarter
          env.store = env.tree.followPath(env.path).fields[value.substring(1)]
        env.path.push(node.substring(1))

      console.log(JSON.stringify(env))
      return env

    # Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
    # Expects 1 parameter, a value.
    return: (values, env) ->
      value = values[0]

      if valueStarter.includes(value.charAt(0))
        if value.charAt(0) == fieldStarter
          env.store = env.tree.followPath(env.path).fields[value.substring(1)]
        env.path = env.path.slice(0, env.path.length - 1)
      console.log(JSON.stringify(env))
      return env

    # Sets a field in the node to the value indicated.
    # Expects 2 parameters, a field and a value.
    set: (values, env) ->
      field = values[0]
      value = values[1]

      if field.charAt(0) == fieldStarter and valueStarter.includes(value.charAt(0))
        actualValue = 0
        if value.charAt(0) == storeChar
          actualValue = env.store
        else if value.charAt(0) == fieldStarter
          actualValue = env.tree.followPath(env.path).fields[value.substring(1)]
        env.tree.followPath(env.path).fields[field.substring(1)] = actualValue

      console.log(JSON.stringify(env))
      return env

    # Adds a field to store.
    # Expects 1 parameter, a field.
    add: (values, env) ->
      field = values[0]

      if field.charAt(0) == fieldStarter
        env.store += env.tree.followPath(env.path).fields[field.substring(1)]

      console.log(JSON.stringify(env))
      return env

    # Subtracts a field from store.
    # Expects 1 parameter, a field.
    sub: (values, env) ->
      field = values[0]

      if field.charAt(0) == fieldStarter
        env.store -= env.tree.followPath(env.path).fields[field.substring(1)]

      console.log(JSON.stringify(env))
      return env

    # Inverts store.
    # Expects 0 parameters.
    invert: (values, env) ->
      env.store = -env.store

      console.log(JSON.stringify(env))
      return env

    # Marks a jumping point.
    # Expects 1 parameter, a string.
    mark: (values, env) ->
      string = values[0]

      if !string.match(/[^A-Z]/i)?
        env.marks[string] = env.line

      console.log(JSON.stringify(env))
      return env

    # Jumps to a marked point.
    # Expects two parameters, a conditional, and a string.
    jump: (values, env) ->
      leftComparator = values[0]
      comparison = values[1]
      rightComparator = values[2]
      jumpDestination = values[3]

      if valueStarter.includes(leftComparator.charAt(0)) and valueStarter.includes(rightComparator.charAt(0))
        if leftComparator.charAt(0) == fieldStarter
          leftComparator = env.tree.followPath(env.path).fields[leftComparator.substring(1)]
        else
          leftComparator = env.store

        if rightComparator.charAt(0) == fieldStarter
          rightComparator = env.tree.followPath(env.path).fields[rightComparator.substring(1)]
        else
          rightComparator = env.store

      outcome = false
      switch comparison
        when '!' then outcome = (leftComparator != rightComparator)
        when '=' then outcome = (leftComparator == rightComparator)
        when '>' then outcome = (leftComparator > rightComparator)
        when '<' then outcome = (leftComparator < rightComparator)

      if outcome and !jumpDestination.match(/[^A-Z]/i)?
        env.line = env.marks[jumpDestination]

      console.log(JSON.stringify(env))
      return env

    # Skips a number of lines.
    # Expects two parameters, a conditional, and an integer.
    skip: (values, env) ->
      leftComparator = values[0]
      comparison = values[1]
      rightComparator = values[2]
      skips = values[3]

      if valueStarter.includes(leftComparator.charAt(0)) and valueStarter.includes(rightComparator.charAt(0))
        if leftComparator.charAt(0) == fieldStarter
          leftComparator = env.tree.followPath(env.path).fields[leftComparator.substring(1)]
        else
          leftComparator = env.store

        if rightComparator.charAt(0) == fieldStarter
          rightComparator = env.tree.followPath(env.path).fields[rightComparator.substring(1)]
        else
          rightComparator = env.store

      outcome = false
      switch comparison
        when '!' then outcome = (leftComparator != rightComparator)
        when '=' then outcome = (leftComparator == rightComparator)
        when '>' then outcome = (leftComparator > rightComparator)
        when '<' then outcome = (leftComparator < rightComparator)

      if outcome and !skips.match(/[^0-9]/i)?
        env.line += parseInt(skips)


      console.log(JSON.stringify(env))
      return env

  # Forgive me, codemasters, but I need to insert the view into this model class, just this once.

  canvas = document.getElementById('env_view')
  ctxt = canvas.getContext('2d')

  # Load ALL assets.
  starter = null
  goal = null
  mission = null
  network = null
  currentRunner = null

  loadJSON = (file) ->
    $.getJSON(file).done (data) ->
      starter = data.startingTree
      goal = data.completeTree
      mission = data.mission

      starter = new Node starter.name, starter.type, starter.fields, starter.linksTo
      network = starter.copy()

      $('#mission_text').text(mission)

      currentRunner = new InjectionRunner
      currentRunner.load(null, network)
      redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().store)

  iconSpriteSheet = new Image()
  iconSpriteSheet.onload = ->
    loadJSON('https://api.myjson.com/bins/gz2he')
  iconSpriteSheet.src = 'img/icon_spritesheet.png'

  # Distance in pixels between a node and its children.
  nodeChildrenDistance = 300
  # End asset loading.

  # Renders a view of the network.
  # node: the network node to draw.
  # x: the x-location to draw the node at.
  # y: the y-location to draw the node at.
  # s_range: the start of the angle range this node can draw its children on.
  # e_range: the end of the angle range this node can draw its children on.
  renderView = (node, path, store, x, y, s_range, e_range) ->
    colorOffset = 0
    isCurrentNode = false
    if path[path.length - 1] == node.name
      colorOffset = 240
      isCurrentNode = true

    if node.type == 'console'
      ctxt.drawImage(iconSpriteSheet, 0, colorOffset, 240, 240, x, y, 100, 100)
    else if node.type == 'server'
      ctxt.drawImage(iconSpriteSheet, 480, colorOffset, 240, 240, x, y, 100, 100)
    else if node.type == 'computer'
      ctxt.drawImage(iconSpriteSheet, 240, colorOffset, 240, 240, x, y, 100, 100)

    ctxt.font = '20px Fira Code'
    ctxt.fillText('@' + node.name, x, y + 100 + 20, 200)

    ctxt.font = '15px Fira Code'
    offset = 135
    for field of node.fields
      if node.fields.hasOwnProperty(field)
        ctxt.fillText('#' + field + ' → ' + node.fields[field], x + 5, y + offset, 200)
        offset += 15
    if isCurrentNode
      ctxt.fillStyle = '#FF3797'
      ctxt.fillText('$' + ' → ' + store, x + 5, y + offset, 200)
      ctxt.fillStyle = 'black'

    if Object.keys(node.linksTo).length > 0
      numChildren = Object.keys(node.linksTo).length
      currentChild = 1
      for child of node.linksTo
        if node.linksTo.hasOwnProperty(child)
          drawAngle = ((e_range - s_range) / (numChildren + 1)) * currentChild * 0.01745329
          new_s_range = s_range + ((e_range - s_range) / numChildren) * (currentChild - 1)
          new_e_range = new_s_range + ((e_range - s_range) / numChildren)
          end_x = x + nodeChildrenDistance * Math.cos(drawAngle)
          end_y = y + nodeChildrenDistance * Math.sin(drawAngle)

          ctxt.beginPath()
          ctxt.moveTo(x + 50, y + 50)
          ctxt.lineTo(end_x + 50, end_y + 50)
          ctxt.lineWidth = 5
          ctxt.strokeStyle = 'rgba(100, 100, 100, 0.3)'
          ctxt.stroke()

          renderView(node.linksTo[child], path, store, end_x, end_y, new_s_range, new_e_range)
          currentChild += 1

  redraw = (node, path, store) ->
    ctxt.clearRect(0, 0, canvas.width, canvas.height)

    if path.length == 0
      renderView(node, [node.name], store, 50, 50, 0, 90)
    else
      renderView(node, path, store, 50, 50, 0, 90)

  # Adjust canvas bounds on resize, and redraw contents.
  window.addEventListener 'resize', (event) ->
    ctxt.canvas.width = window.innerWidth - 325
    ctxt.canvas.height = window.innerHeight - 50
    redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().store)

  # Set canvas bounds.
  ctxt.canvas.width = window.innerWidth - 325
  ctxt.canvas.height = window.innerHeight - 50

  # End View, resume Model.

  # This creates a rudimentary environment for the Inject.ion code.
  class InjectionRunner
    env = {
      store: 0
      marks: {}
      line: 0
      path: []
      tree: null
    }

    constructor: ->
      @code = null

    env: ->
      return env

    eraseAll: ->
      env.store = 0
      env.marks = {}
      env.line = 0
      env.path = []
      env.tree = null
      @code = null

    isEmpty: ->
      return !@code?

    load: (code, tree) ->
      @code = code
      env.tree = tree

    runNext: ->
      splitLines = @code.split('\n')
      runLine(splitLines[env.line++])

    runAll: ->
      splitLines = @code.split('\n')
      runLine(splitLines[env.line++]) while env.line < splitLines.length

    runLine = (line) ->
      lexemes = line.split(' ')
      env = commandDictionary[lexemes[0]](lexemes.slice(1), env)
      redraw(env.tree, env.path, env.store)

    redraw: ->
      redraw(env.tree, env.path, env.store)

  rebalanceLines = () ->
    numNewLines = 1
    for character in $('#injection_code').val()
      if character == '\n'
        numNewLines += 1

    if numNewLines > $('.line_num').length
      while $('.line_num').length < numNewLines
        $('#line_numbers').append('<li class=\'line_num\' id=\'line' + ($('.line_num').length + 1) + '\'>' + ($('.line_num').length + 1) + '</li>')
    else if numNewLines < $('.line_num').length
      while $('.line_num').length > numNewLines
        $('#line_numbers > li').last().remove()

  highlightLine = (prev, curr) ->
    if prev?
      $('#line' + prev).css('background-color', 'transparent')
    $('#line' + curr).css('background-color', '#FFB8DA')

  # Adjusts line numbers.
  $('#injection_code').bind('input', (event) ->
    rebalanceLines()
  )

  # Selects a new level.
  $('.level').click (event) ->
    loadJSON('https://api.myjson.com/bins/pv2jm')
    $('#injection_run_line').prop('disabled', false)
    $('#injection_run_all').prop('disabled', false)
    $('#injection_code').prop('disabled', false)

  $('#injection_reset_env').click (event) ->
    event.preventDefault()
    $('#line' + currentRunner.env().line).css('background-color', 'transparent')

    currentRunner.eraseAll()
    network = starter.copy()
    console.log(network)
    console.log(starter)
    currentRunner.load(null, network)

    $('#injection_run_line').prop('disabled', false)
    $('#injection_run_all').prop('disabled', false)
    $('#injection_code').prop('disabled', false)

    currentRunner.redraw()

  $('#injection_run_line').click (event) ->
    event.preventDefault()
    prevLine = null
    $('#injection_run_all').prop('disabled', true)
    $('#injection_code').prop('disabled', true)
    if currentRunner.isEmpty()
      currentRunner.load($('#injection_code').val(), network)
    else
      prevLine = currentRunner.env().line
    currentRunner.runNext()
    highlightLine(prevLine, currentRunner.env().line)

  $('#injection_run_all').click (event) ->
    event.preventDefault()
    $('#injection_run_line').prop('disabled', true)
    $('#injection_run_all').prop('disabled', true)
    $('#injection_code').prop('disabled', true)
    currentRunner.load($('#injection_code').val(), network)
    currentRunner.runAll()
    if network.checkAgainst(goal)
      $('#win_container').fadeIn(300)

  $('#open_manual').click (event) ->
    event.preventDefault()
    $('#reference_manual').fadeIn(500)

  $('#close_manual').click (event) ->
    event.preventDefault()
    $('#reference_manual').fadeOut(500)

  # On init:
  rebalanceLines()
) jQuery

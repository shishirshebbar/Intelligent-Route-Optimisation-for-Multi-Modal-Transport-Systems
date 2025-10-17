api_version = 4
function setup()
  return {properties = {weight_name = 'routability'}}
end

function process_way(profile, way, result)
  result.forward_mode = 1
  result.backward_mode = 1
  result.forward_speed = 50
  result.backward_speed = 50
end

function process_node(profile, node, result) end
function process_turn(profile, turn) turn.duration = 0 end
